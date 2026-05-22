/**
 * Fashion Freelancing — full data schema
 *
 * Every entity, every field, fully typed via JSDoc.
 * Works in plain HTML (no build) AND Astro/TypeScript.
 *
 * When swapping to a real backend (Firebase / Postgres / whatever),
 * keep these shapes — only the storage layer changes.
 */

// ============================================================
//  CORE ENTITIES
// ============================================================

/**
 * @typedef {'creator' | 'brand' | 'admin'} UserRole
 *
 * @typedef {Object} User
 * @property {string}    id              uuid
 * @property {string}    email
 * @property {string}    name
 * @property {string}    handle          unique @username
 * @property {UserRole}  role
 * @property {string}    avatar          URL
 * @property {string}    [coverImage]    URL — full-bleed banner
 * @property {string}    locale          'en-US' | 'fr-FR' | …
 * @property {string}    timezone        IANA tz, e.g. 'Asia/Tokyo'
 * @property {string}    [phone]
 * @property {boolean}   emailVerified
 * @property {boolean}   phoneVerified
 * @property {boolean}   twoFactorEnabled
 * @property {string}    createdAt       ISO 8601
 * @property {string}    updatedAt       ISO 8601
 * @property {string}    [lastSignInAt]
 * @property {UserPlan}  plan
 * @property {UserStatus} status
 * @property {NotificationPrefs} notificationPrefs
 * @property {string[]}  [savedFreelancerIds]   creator/brand can save
 * @property {string[]}  [savedJobIds]          creator can save jobs
 * @property {string[]}  [followerIds]
 * @property {string[]}  [followingIds]
 */

/** @typedef {'free' | 'pro' | 'studio' | 'enterprise'} UserPlan */
/** @typedef {'active' | 'suspended' | 'deleted' | 'pending_verification'} UserStatus */

/**
 * @typedef {Object} NotificationPrefs
 * @property {boolean} emailNewOrder
 * @property {boolean} emailNewMessage
 * @property {boolean} emailDelivery
 * @property {boolean} emailWeeklyDigest
 * @property {boolean} emailMarketing
 * @property {boolean} pushNewOrder
 * @property {boolean} pushNewMessage
 */

// ============================================================
//  FREELANCER (extends User with seller-specific fields)
// ============================================================

/**
 * @typedef {Object} Freelancer
 * @property {string}    id                   matches User.id
 * @property {string}    userId               same as id (denormalized for queries)
 * @property {string}    name
 * @property {string}    handle
 * @property {string}    avatar
 * @property {string}    cover
 * @property {string}    headline             "Tech pack designer · Lagos"
 * @property {string}    bio                  longer about-me
 * @property {string}    serviceSlug          primary service category
 * @property {string[]}  serviceSlugs         all services they offer
 * @property {string[]}  skills               freeform tags
 * @property {string[]}  tools                "CLO3D", "Figma", "Procreate"…
 * @property {string[]}  languages            ["en", "fr"]
 * @property {string}    city
 * @property {string}    country
 * @property {string}    countryCode          ISO 3166-1 alpha-2
 * @property {Currency}  currency
 * @property {number}    fromPrice            in major currency units (USD, EUR…)
 * @property {number}    rating               0–5
 * @property {number}    reviewCount
 * @property {number}    completedOrders
 * @property {number}    onTimePercent        0–100
 * @property {number}    completionPercent    0–100
 * @property {number}    responseTimeMinutes
 * @property {boolean}   isAvailable          taking new work?
 * @property {VerificationLevel} verificationLevel
 * @property {Badge[]}   badges
 * @property {string[]}  portfolioImageIds    references to PortfolioItem
 * @property {string[]}  packageIds           references to Package
 * @property {Experience[]} experience
 * @property {SocialLink[]} socialLinks
 * @property {number}    profileViews30d
 * @property {number}    followerCount
 * @property {string}    createdAt
 * @property {string}    updatedAt
 */

/** @typedef {'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'AUD' | 'CAD'} Currency */
/** @typedef {'unverified' | 'pending' | 'verified' | 'top_rated' | 'top_1'} VerificationLevel */
/** @typedef {'featured' | 'rising' | 'pro' | 'top_1' | 'verified' | 'top_rated' | 'sustainable' | 'vogue_alum'} Badge */

/**
 * @typedef {Object} PortfolioItem
 * @property {string} id
 * @property {string} freelancerId
 * @property {'image'|'video'|'pdf'|'figma'} type
 * @property {string} url
 * @property {string} [thumbnailUrl]
 * @property {string} [title]
 * @property {string} [description]
 * @property {string[]} tags
 * @property {number} order            sort within profile
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Experience
 * @property {string} role
 * @property {string} company
 * @property {string} location
 * @property {string} startYear        "2018"
 * @property {string} [endYear]        undefined = present
 * @property {string} [description]
 */

/**
 * @typedef {Object} SocialLink
 * @property {'instagram'|'behance'|'linkedin'|'tiktok'|'website'|'pinterest'|'figma'} platform
 * @property {string} url
 * @property {boolean} verified
 */

// ============================================================
//  SERVICE CATEGORIES & PACKAGES (the "gigs")
// ============================================================

/**
 * @typedef {Object} ServiceCategory
 * @property {string} slug                'tech-pack-designer'
 * @property {string} name                'Tech pack designer'
 * @property {string} group               'Design' | 'Technical' | …
 * @property {string} icon
 * @property {string} description
 * @property {string} heroImage
 * @property {string[]} relatedSlugs
 * @property {number} freelancerCount
 * @property {number} averagePrice
 */

/**
 * A "package" is what a freelancer sells — basic / standard / premium.
 *
 * @typedef {Object} Package
 * @property {string}     id
 * @property {string}     freelancerId
 * @property {string}     serviceSlug
 * @property {PackageTier} tier
 * @property {string}     title              "Tech pack for one piece"
 * @property {string}     description
 * @property {number}     priceAmount        e.g. 120
 * @property {Currency}   currency
 * @property {number}     deliveryDays
 * @property {number}     revisions          how many free changes
 * @property {string[]}   bullets            ["Front/back/side flats", …]
 * @property {string[]}   addOns             optional add-on IDs
 * @property {boolean}    isActive
 * @property {number}     orderCount         lifetime orders
 * @property {string}     createdAt
 * @property {string}     updatedAt
 */

/** @typedef {'basic' | 'standard' | 'premium'} PackageTier */

// ============================================================
//  ORDERS — placed when a buyer hires a freelancer
// ============================================================

/**
 * @typedef {Object} Order
 * @property {string}      id                   order_xxx
 * @property {string}      buyerId              User.id (brand or creator buying)
 * @property {string}      sellerId             Freelancer.id
 * @property {string}      [packageId]          if from a package
 * @property {string}      [briefId]            if from a custom brief
 * @property {string}      title
 * @property {string}      description          buyer's brief
 * @property {OrderStatus} status
 * @property {OrderTimeline[]} timeline         every status change with timestamp
 * @property {Money}       amount               held in escrow
 * @property {Money}       [tipAmount]
 * @property {string}      [tier]               'basic' | 'standard' | 'premium' for display
 * @property {string[]}    attachmentIds        files buyer uploaded with brief
 * @property {string[]}    deliverableIds       files seller delivered
 * @property {Revision[]}  revisions
 * @property {number}      revisionsUsed
 * @property {number}      revisionsAllowed
 * @property {string}      orderedAt
 * @property {string}      dueAt                deadline
 * @property {string}      [deliveredAt]
 * @property {string}      [reviewedAt]
 * @property {string}      [closedAt]
 * @property {string}      [cancelledAt]
 * @property {boolean}     hasReview
 * @property {string}      [reviewId]
 * @property {string}      [disputeId]
 * @property {string}      threadId             linked Conversation
 */

/**
 * @typedef {'pending_payment' | 'ordered' | 'in_progress' | 'in_review'
 *          | 'delivered' | 'revision_requested' | 'reviewed'
 *          | 'cancelled' | 'refunded' | 'disputed'} OrderStatus
 */

/**
 * @typedef {Object} OrderTimeline
 * @property {OrderStatus} status
 * @property {string}      at                   ISO timestamp
 * @property {string}      [note]
 * @property {string}      [actorId]            who triggered it
 */

/**
 * @typedef {Object} Money
 * @property {number}    amount             integer minor units (cents)
 * @property {Currency}  currency
 */

/**
 * @typedef {Object} Revision
 * @property {string} id
 * @property {string} orderId
 * @property {string} requestedAt
 * @property {string} requestedBy           User.id
 * @property {string} note                  what they asked to change
 * @property {string} [resolvedAt]
 */

// ============================================================
//  BRIEFS / CUSTOM JOBS — buyers post these, freelancers apply
// ============================================================

/**
 * @typedef {Object} Brief
 * @property {string}    id
 * @property {string}    brandId              the buyer
 * @property {string}    title
 * @property {string}    description
 * @property {string}    serviceSlug          which type of freelancer
 * @property {Money}     budgetMin
 * @property {Money}     budgetMax
 * @property {'fixed'|'day_rate'|'hourly'} pricingType
 * @property {number}    durationWeeks
 * @property {WorkLocation} location
 * @property {string[]}  countries            ["US", "FR"] — preferred
 * @property {string[]}  skillsRequired
 * @property {string[]}  attachmentIds
 * @property {boolean}   isUrgent
 * @property {BriefStatus} status
 * @property {number}    applicantCount
 * @property {string[]}  applicationIds
 * @property {string}    [hiredFreelancerId]
 * @property {string}    postedAt
 * @property {string}    closesAt
 * @property {string}    [hiredAt]
 * @property {string}    [closedAt]
 */

/** @typedef {'remote' | 'hybrid' | 'onsite'} WorkLocation */
/** @typedef {'open' | 'reviewing' | 'shortlisting' | 'hired' | 'closed' | 'expired'} BriefStatus */

/**
 * @typedef {Object} Application
 * @property {string} id
 * @property {string} briefId
 * @property {string} freelancerId
 * @property {string} pitch                  cover letter
 * @property {Money}  proposedAmount
 * @property {number} proposedDurationDays
 * @property {string} [aiAssisted]           true if drafted by AI
 * @property {string[]} attachmentIds
 * @property {ApplicationStatus} status
 * @property {string} sentAt
 * @property {string} [shortlistedAt]
 * @property {string} [hiredAt]
 * @property {string} [declinedAt]
 */

/** @typedef {'sent' | 'viewed' | 'shortlisted' | 'hired' | 'declined' | 'withdrawn'} ApplicationStatus */

// ============================================================
//  MESSAGING
// ============================================================

/**
 * @typedef {Object} Conversation
 * @property {string}  id
 * @property {string[]} participantIds
 * @property {string}  [orderId]             linked to an order, if any
 * @property {string}  [briefId]
 * @property {string}  lastMessagePreview
 * @property {string}  lastMessageAt
 * @property {string}  lastSenderId
 * @property {Object<string, number>} unreadCountByUser   { userId: 3 }
 * @property {string}  createdAt
 */

/**
 * @typedef {Object} Message
 * @property {string}  id
 * @property {string}  conversationId
 * @property {string}  senderId
 * @property {string}  body
 * @property {'text'|'file'|'image'|'voice'|'system'} type
 * @property {Attachment[]} attachments
 * @property {string}  sentAt
 * @property {string}  [editedAt]
 * @property {string}  [readAt]
 * @property {boolean} delivered
 * @property {string[]} reactions             user IDs who reacted (simple model)
 */

/**
 * @typedef {Object} Attachment
 * @property {string}  id
 * @property {string}  url
 * @property {string}  name
 * @property {number}  sizeBytes
 * @property {string}  mimeType
 * @property {'image'|'video'|'pdf'|'figma'|'other'} kind
 * @property {string}  [thumbnailUrl]
 * @property {string}  uploadedAt
 * @property {string}  uploadedBy
 */

// ============================================================
//  REVIEWS
// ============================================================

/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} orderId
 * @property {string} freelancerId
 * @property {string} buyerId
 * @property {number} rating              1–5
 * @property {string} body
 * @property {Object} ratings             granular
 * @property {number} ratings.communication
 * @property {number} ratings.quality
 * @property {number} ratings.expertise
 * @property {number} ratings.delivery
 * @property {string} createdAt
 * @property {string} [response]          freelancer's reply
 * @property {string} [respondedAt]
 */

// ============================================================
//  NOTIFICATIONS
// ============================================================

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} userId
 * @property {NotificationKind} kind
 * @property {string} title
 * @property {string} [body]
 * @property {string} [icon]              emoji
 * @property {string} [actionUrl]         where it links to
 * @property {string} [actorId]           who caused it
 * @property {string} [orderId]
 * @property {string} [conversationId]
 * @property {boolean} read
 * @property {string} createdAt
 */

/**
 * @typedef {'order_placed'|'order_delivered'|'order_revised'|'order_completed'
 *          |'message_received'|'review_received'|'review_responded'
 *          |'application_shortlisted'|'application_hired'|'application_declined'
 *          |'payment_released'|'payment_held'|'verification_approved'
 *          |'system'} NotificationKind
 */

// ============================================================
//  PAYMENTS
// ============================================================

/**
 * @typedef {Object} PaymentMethod
 * @property {string} id
 * @property {string} userId
 * @property {'card'|'bank'|'paypal'|'wise'} type
 * @property {string} brand               'visa', 'mastercard', 'paypal'…
 * @property {string} last4
 * @property {string} [expMonth]
 * @property {string} [expYear]
 * @property {boolean} isDefault
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} userId
 * @property {string} [orderId]
 * @property {'charge'|'release'|'refund'|'payout'|'subscription'} kind
 * @property {Money}  amount
 * @property {Money}  [fee]
 * @property {string} description
 * @property {'pending'|'completed'|'failed'} status
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Payout
 * @property {string} id
 * @property {string} userId               who's getting paid
 * @property {Money}  amount
 * @property {string} method               PaymentMethod.id
 * @property {'pending'|'processing'|'paid'|'failed'} status
 * @property {string[]} orderIds
 * @property {string} requestedAt
 * @property {string} [paidAt]
 */

// ============================================================
//  DISPUTES
// ============================================================

/**
 * @typedef {Object} Dispute
 * @property {string} id
 * @property {string} orderId
 * @property {string} openedBy            User.id
 * @property {string} reason
 * @property {string} description
 * @property {string[]} evidenceIds       Attachment IDs
 * @property {DisputeStatus} status
 * @property {string} [resolution]        admin's note
 * @property {string} [resolvedBy]        admin user id
 * @property {Money}  [refundAmount]
 * @property {string} openedAt
 * @property {string} [resolvedAt]
 */

/** @typedef {'investigating'|'awaiting_buyer'|'awaiting_seller'|'escalated'|'resolved_buyer'|'resolved_seller'|'split'} DisputeStatus */

// ============================================================
//  ADMIN: MODERATION, VERIFICATION, FRAUD
// ============================================================

/**
 * @typedef {Object} ModerationItem
 * @property {string} id
 * @property {'gig'|'profile'|'review'|'message'|'portfolio'} targetType
 * @property {string} targetId
 * @property {string} reason
 * @property {string} [details]
 * @property {string[]} reporterIds
 * @property {number} flagCount
 * @property {'low'|'medium'|'high'} risk
 * @property {'pending'|'reviewing'|'approved'|'removed'} status
 * @property {string} [reviewedBy]
 * @property {string} createdAt
 * @property {string} [reviewedAt]
 */

/**
 * @typedef {Object} VerificationRequest
 * @property {string} id
 * @property {string} freelancerId
 * @property {number} aiScore             0–100
 * @property {'new'|'reviewing'|'holding'|'approved'|'rejected'} status
 * @property {string} [reviewedBy]
 * @property {string} [notes]
 * @property {string} submittedAt
 * @property {string} [reviewedAt]
 */

/**
 * @typedef {Object} FraudSignal
 * @property {string} id
 * @property {string} userId
 * @property {number} riskScore           0–100
 * @property {string} reason
 * @property {string[]} signals           ['velocity', 'vpn', 'chargeback']
 * @property {string} [ipAddress]
 * @property {string} [country]
 * @property {'auto_paused'|'review'|'cleared'|'suspended'} action
 * @property {string} createdAt
 */

// ============================================================
//  SUBSCRIPTIONS (monthly recurring billing)
// ============================================================

/**
 * @typedef {Object} Subscription
 * @property {string} id
 * @property {string} userId
 * @property {UserPlan} plan
 * @property {Money}  monthlyAmount
 * @property {'active'|'past_due'|'cancelled'|'trialing'} status
 * @property {string} startedAt
 * @property {string} [trialEndsAt]
 * @property {string} [renewsAt]
 * @property {string} [cancelledAt]
 * @property {string} paymentMethodId
 */

// ============================================================
//  SESSION (frontend-only, what represents a signed-in user)
// ============================================================

/**
 * @typedef {Object} Session
 * @property {string}  userId
 * @property {string}  email
 * @property {string}  name
 * @property {string}  handle
 * @property {string}  avatar
 * @property {UserRole} role
 * @property {UserPlan} plan
 * @property {string}  signedInAt
 * @property {string}  [expiresAt]
 */

// ============================================================
//  SEARCH / FILTERS
// ============================================================

/**
 * @typedef {Object} SearchFilters
 * @property {string}    [q]                   text query
 * @property {string}    [category]            ServiceCategory.slug
 * @property {string}    [group]               ServiceCategory.group
 * @property {number}    [priceMin]
 * @property {number}    [priceMax]
 * @property {number}    [maxDeliveryDays]
 * @property {string[]}  [countries]
 * @property {VerificationLevel[]} [levels]
 * @property {boolean}   [availableNow]
 * @property {'best_match'|'top_rated'|'newest'|'lowest_price'|'fastest'} [sort]
 * @property {number}    [page]
 * @property {number}    [perPage]
 */

/**
 * @typedef {Object} SearchResult
 * @template T
 * @property {T[]}    items
 * @property {number} total
 * @property {number} page
 * @property {number} perPage
 * @property {number} pageCount
 */

// ============================================================
//  Export sentinel for environments that need a default export
// ============================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {}; // schema is JSDoc-only
}
