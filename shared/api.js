/**
 * Fashion Freelancing — API client
 *
 * Production-shaped: every method is async, returns Promises, takes typed inputs.
 * Today: reads/writes through the localStorage store + small artificial latency
 *         so loading states & race conditions surface during dev.
 * Tomorrow: replace the body of each method with a `fetch` call. Same surface.
 *
 * Usage (in HTML):
 *     <script src="/shared/store.js"></script>
 *     <script src="/shared/api.js"></script>
 *     api.users.signIn({ email }).then(s => …)
 *
 * Usage (in Astro/TS):
 *     import { api } from '/shared/api.js'
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./store.js'));
  else root.api = factory(root.FFStore);
})(typeof self !== 'undefined' ? self : this, function (Store) {

  // Artificial latency makes the UI feel real. Set to 0 for instant.
  const LATENCY_MS = 200;

  const lag = () => Store.sleep(LATENCY_MS);
  const clone = Store.clone;
  const uid = Store.uid;
  const now = Store.now;

  // -----------------------------------------------------
  //  Helpers used by multiple resources
  // -----------------------------------------------------
  const findById = (list, id) => list.find(x => x.id === id);
  const requireById = (list, id, name = 'item') => {
    const item = findById(list, id);
    if (!item) throw new Error(`${name} ${id} not found`);
    return item;
  };
  const paginate = (items, page = 1, perPage = 24) => {
    const total = items.length;
    const start = (page - 1) * perPage;
    return { items: items.slice(start, start + perPage), total, page, perPage, pageCount: Math.ceil(total / perPage) };
  };
  const matchesText = (text, q) => !q ? true : (text || '').toLowerCase().includes(q.toLowerCase());

  // ============================================================
  //  USERS / AUTH
  // ============================================================
  const users = {
    /** Find user by email (mock: case-insensitive). */
    async findByEmail(email) {
      await lag();
      return Store.getState().users.find(u => u.email.toLowerCase() === (email || '').toLowerCase()) || null;
    },

    /**
     * Mock sign-in: if email matches a seeded user, sign them in.
     * Otherwise create a new user with role inferred (default: brand).
     */
    async signIn({ email, password, role }) {
      await lag();
      let u = await this.findByEmail(email);
      if (!u) {
        // Auto-create a demo user
        u = await this.signUp({ email, password, role: role || 'brand', name: email.split('@')[0] });
      }
      const session = {
        userId: u.id, email: u.email, name: u.name, handle: u.handle,
        avatar: u.avatar, role: u.role, plan: u.plan,
        signedInAt: now(),
      };
      Store.setSession(session);
      // Update last sign-in
      Store.setState(s => {
        s.users = s.users.map(x => x.id === u.id ? { ...x, lastSignInAt: now() } : x);
        return s;
      });
      return session;
    },

    async signUp({ email, password, name, role = 'creator', handle }) {
      await lag();
      const existing = await this.findByEmail(email);
      if (existing) throw new Error('An account with this email already exists.');
      const id = uid('u');
      const user = {
        id, email, name: name || email.split('@')[0],
        handle: handle || ('@' + email.split('@')[0]),
        role,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop',
        locale: 'en-US', timezone: 'UTC',
        emailVerified: false, phoneVerified: false, twoFactorEnabled: false,
        plan: role === 'brand' ? 'studio' : 'free',
        status: 'active',
        createdAt: now(), updatedAt: now(),
        savedFreelancerIds: [], savedJobIds: [],
        notificationPrefs: {
          emailNewOrder:true, emailNewMessage:true, emailDelivery:true,
          emailWeeklyDigest:true, emailMarketing:false,
          pushNewOrder:true, pushNewMessage:true,
        },
      };
      Store.setState(s => { s.users.push(user); return s; });
      return user;
    },

    async signOut() {
      await lag();
      Store.clearSession();
      return true;
    },

    /** Currently-signed-in user (full record), or null. */
    async me() {
      await lag();
      const session = Store.getSession();
      if (!session) return null;
      return findById(Store.getState().users, session.userId) || null;
    },

    /** Synchronous version for first paint (no latency, no promise). */
    meSync() {
      const session = Store.getSession();
      if (!session) return null;
      return findById(Store.getState().users, session.userId) || null;
    },

    sessionSync() { return Store.getSession(); },

    async update(userId, patch) {
      await lag();
      Store.setState(s => {
        s.users = s.users.map(u => u.id === userId ? { ...u, ...patch, updatedAt: now() } : u);
        return s;
      });
      return findById(Store.getState().users, userId);
    },

    /** Toggle saved freelancer for current user. Returns new array. */
    async toggleSavedFreelancer(freelancerId) {
      await lag();
      const session = Store.getSession();
      if (!session) throw new Error('Not signed in.');
      let saved;
      Store.setState(s => {
        s.users = s.users.map(u => {
          if (u.id !== session.userId) return u;
          const set = new Set(u.savedFreelancerIds || []);
          if (set.has(freelancerId)) set.delete(freelancerId);
          else set.add(freelancerId);
          saved = Array.from(set);
          return { ...u, savedFreelancerIds: saved, updatedAt: now() };
        });
        return s;
      });
      return saved;
    },

    async getSaved() {
      await lag();
      const session = Store.getSession();
      if (!session) return [];
      const u = findById(Store.getState().users, session.userId);
      const ids = u?.savedFreelancerIds || [];
      const fls = Store.getState().freelancers;
      return ids.map(id => findById(fls, id)).filter(Boolean);
    },
  };

  // ============================================================
  //  FREELANCERS
  // ============================================================
  const freelancers = {
    async list(filters = {}) {
      await lag();
      let items = clone(Store.getState().freelancers);

      if (filters.q) {
        const q = filters.q;
        items = items.filter(f =>
          matchesText(f.name, q) ||
          matchesText(f.headline, q) ||
          matchesText(f.serviceSlug, q) ||
          matchesText(f.city, q) ||
          matchesText(f.country, q) ||
          (f.skills || []).some(s => matchesText(s, q))
        );
      }
      if (filters.category) items = items.filter(f => f.serviceSlug === filters.category || (f.serviceSlugs || []).includes(filters.category));
      if (filters.group) {
        const slugs = Store.getState().services.filter(s => s.group === filters.group).map(s => s.slug);
        items = items.filter(f => slugs.includes(f.serviceSlug));
      }
      if (filters.priceMin != null) items = items.filter(f => f.fromPrice >= filters.priceMin);
      if (filters.priceMax != null) items = items.filter(f => f.fromPrice <= filters.priceMax);
      if (filters.countries && filters.countries.length) items = items.filter(f => filters.countries.includes(f.countryCode));
      if (filters.levels && filters.levels.length) items = items.filter(f => filters.levels.includes(f.verificationLevel));
      if (filters.availableNow) items = items.filter(f => f.isAvailable);

      // Sort
      const sort = filters.sort || 'best_match';
      const sorters = {
        best_match:    (a, b) => b.rating - a.rating,
        top_rated:     (a, b) => (b.rating * 100 + b.reviewCount) - (a.rating * 100 + a.reviewCount),
        newest:        (a, b) => (b.createdAt > a.createdAt ? 1 : -1),
        lowest_price:  (a, b) => a.fromPrice - b.fromPrice,
        fastest:       (a, b) => a.responseTimeMinutes - b.responseTimeMinutes,
      };
      items.sort(sorters[sort] || sorters.best_match);

      return paginate(items, filters.page || 1, filters.perPage || 24);
    },

    async get(id) {
      await lag();
      return clone(findById(Store.getState().freelancers, id));
    },

    async getByHandle(handle) {
      await lag();
      const h = handle.startsWith('@') ? handle : '@' + handle;
      return clone(Store.getState().freelancers.find(f => f.handle === h));
    },

    async getPackages(freelancerId) {
      await lag();
      return clone(Store.getState().packages.filter(p => p.freelancerId === freelancerId && p.isActive));
    },

    async getReviews(freelancerId) {
      await lag();
      return clone(Store.getState().reviews.filter(r => r.freelancerId === freelancerId));
    },
  };

  // ============================================================
  //  SERVICES (categories)
  // ============================================================
  const services = {
    async list({ group } = {}) {
      await lag();
      let items = clone(Store.getState().services);
      if (group) items = items.filter(s => s.group === group);
      return items;
    },
    async get(slug) {
      await lag();
      return clone(Store.getState().services.find(s => s.slug === slug));
    },
    /** Sync version for fast first paint (no Promise). */
    listSync() { return clone(Store.getState().services); },
    getSync(slug) { return clone(Store.getState().services.find(s => s.slug === slug)); },
  };

  // ============================================================
  //  PACKAGES
  // ============================================================
  const packages = {
    async get(id) {
      await lag();
      return clone(findById(Store.getState().packages, id));
    },
    async list(filters = {}) {
      await lag();
      let items = clone(Store.getState().packages.filter(p => p.isActive));
      if (filters.freelancerId) items = items.filter(p => p.freelancerId === filters.freelancerId);
      if (filters.serviceSlug) items = items.filter(p => p.serviceSlug === filters.serviceSlug);
      return items;
    },
  };

  // ============================================================
  //  ORDERS
  // ============================================================
  const orders = {
    async create({ buyerId, sellerId, packageId, briefId, title, description, amount, currency, dueInDays = 7 }) {
      await lag();
      const buyerSession = Store.getSession();
      if (!buyerSession && !buyerId) throw new Error('Not signed in.');
      const id = uid('order');
      const t = now();
      const due = new Date(Date.now() + dueInDays * 86400000).toISOString();
      // Conversation auto-created
      const convId = uid('conv');
      const _buyerId = buyerId || buyerSession.userId;

      Store.setState(s => {
        const order = {
          id, buyerId: _buyerId, sellerId,
          packageId: packageId || null, briefId: briefId || null,
          title, description,
          status: 'ordered',
          timeline: [{ status: 'ordered', at: t, actorId: _buyerId }],
          amount: { amount: amount * 100, currency: currency || 'USD' },
          tier: packageId ? (s.packages.find(p => p.id === packageId) || {}).tier : null,
          attachmentIds: [], deliverableIds: [], revisions: [],
          revisionsUsed: 0, revisionsAllowed: 2,
          orderedAt: t, dueAt: due,
          hasReview: false, threadId: convId,
        };
        s.orders.unshift(order);
        s.conversations.push({
          id: convId, participantIds: [_buyerId, sellerId], orderId: id, briefId: null,
          lastMessagePreview: 'Order placed.',
          lastMessageAt: t, lastSenderId: _buyerId,
          unreadCountByUser: { [sellerId]: 1, [_buyerId]: 0 },
          createdAt: t,
        });
        s.notifications.push({
          id: uid('n'), userId: sellerId, kind: 'order_placed',
          title: `New order: ${title}`, icon: '📦',
          actionUrl: `/dashboard/orders/${id}`,
          actorId: _buyerId, orderId: id, read: false, createdAt: t,
        });
        return s;
      });

      return findById(Store.getState().orders, id);
    },

    async list(filters = {}) {
      await lag();
      let items = clone(Store.getState().orders);
      if (filters.buyerId)  items = items.filter(o => o.buyerId === filters.buyerId);
      if (filters.sellerId) items = items.filter(o => o.sellerId === filters.sellerId);
      if (filters.userId)   items = items.filter(o => o.buyerId === filters.userId || o.sellerId === filters.userId);
      if (filters.status)   items = items.filter(o => filters.status.includes ? filters.status.includes(o.status) : o.status === filters.status);
      items.sort((a, b) => (b.orderedAt > a.orderedAt ? 1 : -1));
      return items;
    },

    async get(id) {
      await lag();
      return clone(findById(Store.getState().orders, id));
    },

    async updateStatus(id, status, note) {
      await lag();
      const session = Store.getSession();
      Store.setState(s => {
        s.orders = s.orders.map(o => {
          if (o.id !== id) return o;
          const at = now();
          const timeline = [...(o.timeline || []), { status, at, note, actorId: session?.userId }];
          const patch = { status, timeline };
          if (status === 'delivered') patch.deliveredAt = at;
          if (status === 'reviewed' || status === 'closed') patch.reviewedAt = at;
          if (status === 'cancelled') patch.cancelledAt = at;
          return { ...o, ...patch };
        });
        return s;
      });
      return findById(Store.getState().orders, id);
    },
  };

  // ============================================================
  //  BRIEFS / APPLICATIONS
  // ============================================================
  const briefs = {
    async list(filters = {}) {
      await lag();
      let items = clone(Store.getState().briefs);
      if (filters.status) items = items.filter(b => b.status === filters.status);
      if (filters.brandId) items = items.filter(b => b.brandId === filters.brandId);
      if (filters.serviceSlug) items = items.filter(b => b.serviceSlug === filters.serviceSlug);
      if (filters.q) items = items.filter(b => matchesText(b.title, filters.q) || matchesText(b.description, filters.q));
      items.sort((a, b) => (b.postedAt > a.postedAt ? 1 : -1));
      return items;
    },
    async get(id) {
      await lag();
      return clone(findById(Store.getState().briefs, id));
    },
    async create(data) {
      await lag();
      const session = Store.getSession();
      if (!session) throw new Error('Not signed in.');
      const id = uid('brief');
      const t = now();
      const brief = {
        id, brandId: session.userId,
        title: data.title, description: data.description, serviceSlug: data.serviceSlug,
        budgetMin: { amount: (data.budgetMin || 0) * 100, currency: data.currency || 'USD' },
        budgetMax: { amount: (data.budgetMax || 0) * 100, currency: data.currency || 'USD' },
        pricingType: data.pricingType || 'fixed',
        durationWeeks: data.durationWeeks || 4,
        location: data.location || 'remote',
        countries: data.countries || [],
        skillsRequired: data.skillsRequired || [],
        attachmentIds: [], isUrgent: !!data.isUrgent,
        status: 'open', applicantCount: 0, applicationIds: [],
        postedAt: t, closesAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      };
      Store.setState(s => { s.briefs.unshift(brief); return s; });
      return brief;
    },
  };

  const applications = {
    async create({ briefId, freelancerId, pitch, proposedAmount, proposedDurationDays }) {
      await lag();
      const id = uid('app');
      const session = Store.getSession();
      const _freelancerId = freelancerId || session?.userId;
      if (!_freelancerId) throw new Error('Not signed in.');
      Store.setState(s => {
        const app = {
          id, briefId, freelancerId: _freelancerId,
          pitch, proposedAmount: { amount: (proposedAmount || 0) * 100, currency: 'USD' },
          proposedDurationDays: proposedDurationDays || 0,
          status: 'sent', sentAt: now(),
          attachmentIds: [],
        };
        s.applications.push(app);
        s.briefs = s.briefs.map(b => b.id === briefId ? { ...b, applicantCount: b.applicantCount + 1, applicationIds: [...b.applicationIds, id] } : b);
        return s;
      });
      return findById(Store.getState().applications, id);
    },
    async list(filters = {}) {
      await lag();
      let items = clone(Store.getState().applications);
      if (filters.briefId) items = items.filter(a => a.briefId === filters.briefId);
      if (filters.freelancerId) items = items.filter(a => a.freelancerId === filters.freelancerId);
      return items;
    },
  };

  // ============================================================
  //  MESSAGES
  // ============================================================
  const messages = {
    async listConversations(userId) {
      await lag();
      const id = userId || Store.getSession()?.userId;
      if (!id) return [];
      return clone(Store.getState().conversations.filter(c => c.participantIds.includes(id)));
    },
    /**
     * Find an existing 1:1 conversation between the signed-in user and
     * `targetUserId`, or create a new one. Returns the conversation.
     * Throws if not signed in — callers should gate on auth first.
     */
    async startWith(targetUserId) {
      await lag();
      const session = Store.getSession();
      if (!session) throw new Error('Not signed in.');
      const me = session.userId;
      if (!targetUserId || targetUserId === me) throw new Error('Invalid recipient.');
      // existing 1:1 thread?
      const existing = Store.getState().conversations.find(c =>
        c.participantIds.length === 2 &&
        c.participantIds.includes(me) &&
        c.participantIds.includes(targetUserId));
      if (existing) return clone(existing);
      // create a fresh one
      const conv = {
        id: uid('conv'),
        participantIds: [me, targetUserId],
        orderId: null, briefId: null,
        lastMessagePreview: '', lastMessageAt: null, lastSenderId: null,
        unreadCountByUser: { [me]: 0, [targetUserId]: 0 },
        createdAt: now(),
      };
      Store.setState(s => { s.conversations.push(conv); return s; });
      return clone(conv);
    },
    async getMessages(conversationId) {
      await lag();
      return clone(Store.getState().messages.filter(m => m.conversationId === conversationId));
    },
    async send({ conversationId, body, type = 'text' }) {
      await lag();
      const session = Store.getSession();
      if (!session) throw new Error('Not signed in.');
      const id = uid('msg');
      const t = now();
      Store.setState(s => {
        s.messages.push({ id, conversationId, senderId: session.userId, body, type, attachments: [], sentAt: t, delivered: true, reactions: [] });
        s.conversations = s.conversations.map(c => {
          if (c.id !== conversationId) return c;
          const unread = { ...c.unreadCountByUser };
          c.participantIds.filter(p => p !== session.userId).forEach(p => { unread[p] = (unread[p] || 0) + 1; });
          return { ...c, lastMessagePreview: body.slice(0, 80), lastMessageAt: t, lastSenderId: session.userId, unreadCountByUser: unread };
        });
        return s;
      });
      return findById(Store.getState().messages, id);
    },
  };

  // ============================================================
  //  NOTIFICATIONS
  // ============================================================
  const notifications = {
    async list(userId) {
      await lag();
      const id = userId || Store.getSession()?.userId;
      if (!id) return [];
      return clone(Store.getState().notifications.filter(n => n.userId === id).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)));
    },
    async unreadCount(userId) {
      await lag();
      const id = userId || Store.getSession()?.userId;
      if (!id) return 0;
      return Store.getState().notifications.filter(n => n.userId === id && !n.read).length;
    },
    async markRead(id) {
      await lag();
      Store.setState(s => { s.notifications = s.notifications.map(n => n.id === id ? { ...n, read: true } : n); return s; });
    },
    async markAllRead(userId) {
      await lag();
      const _id = userId || Store.getSession()?.userId;
      Store.setState(s => { s.notifications = s.notifications.map(n => n.userId === _id ? { ...n, read: true } : n); return s; });
    },
  };

  // ============================================================
  //  REVIEWS
  // ============================================================
  const reviews = {
    async create({ orderId, rating, body, ratings }) {
      await lag();
      const session = Store.getSession();
      if (!session) throw new Error('Not signed in.');
      const order = findById(Store.getState().orders, orderId);
      if (!order) throw new Error('Order not found.');
      const id = uid('rev');
      const t = now();
      const review = {
        id, orderId,
        freelancerId: order.sellerId, buyerId: order.buyerId,
        rating, body,
        ratings: ratings || { communication: rating, quality: rating, expertise: rating, delivery: rating },
        createdAt: t,
      };
      Store.setState(s => {
        s.reviews.push(review);
        s.orders = s.orders.map(o => o.id === orderId ? { ...o, hasReview: true, reviewId: id, status: 'reviewed', reviewedAt: t } : o);
        // bump freelancer rating average (rough)
        s.freelancers = s.freelancers.map(f => {
          if (f.id !== order.sellerId) return f;
          const newCount = f.reviewCount + 1;
          const newRating = (f.rating * f.reviewCount + rating) / newCount;
          return { ...f, reviewCount: newCount, rating: Math.round(newRating * 100) / 100 };
        });
        return s;
      });
      return review;
    },
  };

  // ============================================================
  //  SEARCH (combined)
  // ============================================================
  const search = {
    /** Search across freelancers + briefs + services. */
    async global(query) {
      await lag();
      const q = (query || '').toLowerCase().trim();
      if (!q) return { freelancers: [], briefs: [], services: [] };
      const state = Store.getState();
      const freelancers = state.freelancers
        .filter(f => matchesText(f.name, q) || matchesText(f.headline, q) || matchesText(f.serviceSlug, q) || (f.skills || []).some(s => matchesText(s, q)))
        .slice(0, 10);
      const briefs = state.briefs
        .filter(b => matchesText(b.title, q) || matchesText(b.description, q))
        .slice(0, 10);
      const svcs = state.services
        .filter(s => matchesText(s.name, q) || matchesText(s.group, q))
        .slice(0, 10);
      return clone({ freelancers, briefs, services: svcs });
    },
  };

  // ============================================================
  //  STATS (for dashboards)
  // ============================================================
  const stats = {
    async forCreator(userId) {
      await lag();
      const id = userId || Store.getSession()?.userId;
      const state = Store.getState();
      const myOrders = state.orders.filter(o => o.sellerId === id);
      const earnings30 = myOrders
        .filter(o => o.status === 'reviewed' || o.status === 'delivered')
        .reduce((sum, o) => sum + o.amount.amount, 0);
      return {
        activeOrders: myOrders.filter(o => ['ordered', 'in_progress', 'delivered'].includes(o.status)).length,
        totalOrders: myOrders.length,
        earningsCents: earnings30,
        reviewCount: state.reviews.filter(r => r.freelancerId === id).length,
        savedBy: state.users.filter(u => (u.savedFreelancerIds || []).includes(id)).length,
      };
    },
    async forBrand(userId) {
      await lag();
      const id = userId || Store.getSession()?.userId;
      const state = Store.getState();
      const myOrders = state.orders.filter(o => o.buyerId === id);
      return {
        activeOrders: myOrders.filter(o => ['ordered', 'in_progress', 'delivered'].includes(o.status)).length,
        totalOrders: myOrders.length,
        spentCents: myOrders.reduce((sum, o) => sum + o.amount.amount, 0),
        openBriefs: state.briefs.filter(b => b.brandId === id && b.status === 'open').length,
        savedFreelancers: (findById(state.users, id)?.savedFreelancerIds || []).length,
      };
    },
  };

  // ============================================================
  //  Util — formatting
  // ============================================================
  const fmt = {
    money(amountCents, currency = 'USD') {
      try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amountCents / 100);
      } catch (e) { return `$${(amountCents / 100).toFixed(0)}`; }
    },
    moneySimple(amountUSD, currency = 'USD') {
      try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amountUSD);
      } catch (e) { return `$${amountUSD}`; }
    },
    timeAgo(iso) {
      const diff = (Date.now() - new Date(iso).getTime()) / 1000;
      if (diff < 60) return 'just now';
      if (diff < 3600) return Math.round(diff / 60) + 'm ago';
      if (diff < 86400) return Math.round(diff / 3600) + 'h ago';
      if (diff < 86400 * 7) return Math.round(diff / 86400) + 'd ago';
      return new Date(iso).toLocaleDateString();
    },
    initials(name) {
      return (name || '').split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();
    },
  };

  return {
    users, freelancers, services, packages, orders, briefs, applications,
    messages, notifications, reviews, search, stats,
    fmt,
    // Direct store access for advanced use
    _store: Store,
  };
});
