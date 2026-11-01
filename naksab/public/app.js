// ——— NAKSAB App — SPA — EN/AR i18n + RTL (مفتاح اللغة في الشريط) ———
const L = {
en: {
  tagline: "Hire the right talent, with confidence",
  h1a: "Hire the right talent,", h1b: "with confidence.",
  lead: "Describe your project in plain words. NAKSAB structures it, matches you with the right professionals, and keeps the whole engagement — proposals, milestones, deliverables, reviews — in one honest workspace.",
  hero_badge: "Stage 1 live — early access",
  built_on: "Built on production-grade technology",
  how_eyebrow: "How it works", how_title: "From idea to delivery, in three steps",
  step1_t: "Describe your project", step1_d: "Plain language is enough. Our AI structures it into a clear, professional request — budgets and requirements stay yours.",
  step2_t: "Get matched, not spammed", step2_d: "A weighted matching engine ranks the right professionals by skills, availability and reputation. You choose who sees your project.",
  step3_t: "Ship with proof", step3_d: "Milestones, messages and deliverables in one room. Completion needs mutual confirmation — reviews stay honest.",
  cats_eyebrow: "Categories", cats_title: "Every craft, one marketplace",
  talent_eyebrow: "Featured professionals", talent_title: "Talent that ships", browse_all: "Browse all talent →",
  cta_title: "Ready when you are.", cta_sub: "Join the first wave of professionals and clients building on NAKSAB.",
  create_profile: "Create your profile", about_naksab: "About NAKSAB",
  mock_t: "New request", mock_d: "“Landing page for my SaaS — budget $300, two weeks.”",
  mock_matches: "Top matches", mock_hired: "Hired — project room opened",
  mock_note: "Live preview of the NAKSAB flow",
  st_freelancers: "Freelancers", st_services: "Live services", st_categories: "Categories", st_real: "Real engagements",
  explore: "Explore talent", post_project: "Post a project", get_started: "Get started", sign_in: "Sign in", sign_out: "Sign out",
  browse_talent: "Browse Talent", services: "Services", discover: "Discover", dashboard: "Dashboard", admin: "Admin", notifications: "Notifications",
  create_account: "Create your account", welcome_back: "Welcome back",
  email: "Email", password: "Password", full_name: "Full name", username: "Username", role: "I am a",
  freelancer: "Freelancer", client: "Client",
  save: "Save", cancel: "Cancel", send: "Send", loading: "Loading…", search: "Search…",
  all_categories: "All categories", no_results: "Nothing here yet.",
  foot_desc: "The professional marketplace where talent meets opportunity — matching, project management and reputation in one honest workspace.",
  foot_market: "Marketplace", foot_account: "Account", foot_platform: "Platform",
  f_talent: "Browse talent", f_post: "Post a project", f_join: "Join as freelancer", f_hire: "Hire talent",
  f_dash: "Dashboard", f_ads: "Advertise", f_about: "About", f_trust: "Trust & Safety",
  a_product_by: "A product by", rights: "All rights reserved.",
  pass_hint: "8+ characters incl. a digit", securing: "Securing…",
  no_account: "New to NAKSAB?", have_account: "Already a member?",
  welcome_toast: "Welcome",
  all_caught: "All caught up.",
  available: "Available", busy: "Busy", n_projects: "projects",
  talent_sub: "Professionals building their reputation with real projects.",
  services_sub: "Fixed-scope offerings with clear prices and delivery times.",
  by: "by", d_delivery: "d delivery", view_profile: "View profile & contact",
  requirements: "Requirements", days_delivery: "-day delivery", revisions: "revisions",
  joined: "joined", completed_projects: "completed projects",
  follow: "Follow", following: "Following", hire_me: "Hire me",
  about_h: "About", no_bio: "No bio yet.", services_h: "Services", no_services: "No services yet.",
  portfolio_h: "Portfolio", no_works: "No work samples yet.", reviews_h: "Reviews", no_reviews: "No reviews yet.",
  discover_sub: "A professional feed — real work, real milestones, no noise.",
  all: "All", work: "Work", achievement: "Achievements", post: "Posts",
  share_work: "+ Share work", signin_interact: "Sign in to interact",
  share_your_work: "Share your work", title: "Title", description: "Description", type: "Type",
  media_type: "Media type", image_link: "Image link", video_link: "Video link (YouTube/Vimeo/direct)",
  media_url: "Media URL (https://)", thumb_url: "Thumbnail URL (optional)", publish: "Publish",
  published_t: "Published",
  dash_sub_admin: "Platform control.", dash_sub_freelancer: "Your professional presence and pipeline.", dash_sub_client: "Your projects and requests.",
  tab_profile: "Profile", tab_services: "My services", tab_open: "Open requests", tab_proposals: "My proposals", tab_requests: "My requests", tab_portfolio: "Portfolio", tab_projects: "Projects",
  headline: "Headline", country: "Country", bio: "Bio",
  cats_hint: "Categories (comma-separated slugs)", skills_hint: "Skills (comma-separated)",
  avatar_url: "Avatar URL (https://)", status: "Status", avail_work: "Available for work",
  profile_saved: "Profile saved.", saved_t: "Saved",
  n_services: "service(s)", new_service: "+ New service", no_services_yet: "No services yet — create your first offering.",
  nothing_shared: "Nothing shared yet.",
  n_requests: "request(s)", new_request: "+ New request", no_requests: "No requests yet.",
  proposals_c: "proposal(s)", budget: "budget", open: "open",
  open_ranked: "Ranked for your profile — send a proposal only where you truly fit.",
  propose: "Propose", no_open: "No open requests right now — check back soon.",
  proposals_hint: "Open requests you respond to will appear with their status here.",
  with: "with", no_projects: "No projects yet.",
  new_service_t: "New service", category: "Category", currency: "Currency",
  price_from: "Price from", price_to: "Price to", delivery_days: "Delivery (days)", revisions_n: "Revisions",
  skills_csv: "Skills (comma-separated)", req_buyer: "Requirements from the buyer",
  publish_service: "Publish service", service_published: "Service published",
  post_sub: "Describe it in plain words — our AI turns it into a structured request. Manual form always available.",
  describe: "Describe your project",
  raw_hint: "I need a landing page for my SaaS with pricing section and contact form. Budget around $300, need it in 2 weeks…",
  ai_structure: "✦ Structure it with Vito AI", write_first: "Write at least a sentence first.", analyzing: "Analyzing…",
  ai_down: "AI is unavailable right now — fill the form manually below, everything works.",
  structured_via: "Structured via", clarify: "Clarify:", review_publish: "Review and publish.",
  full_description: "Full description", budget_from: "Budget from", budget_to: "Budget to", skills_needed: "Skills needed (comma-separated)",
  publish_request: "Publish request", request_published: "Request published — matching begins",
  project_request: "Project request",
  top_matches: "Top matches", weighted_by: "— weighted by skills, availability & reputation",
  no_matches: "No scored matches yet — widen your request.",
  proposals: "Proposals", no_proposals: "No proposals yet — matches were notified implicitly by rank.",
  accept_open: "Accept & open project", open_room: "Open project room →", close_request: "Close this request",
  project_created: "Project created", your_proposal_is: "Your proposal is", send_proposal: "Send a proposal",
  owner_only: "Sign in as the owner to manage this request.",
  your_proposal: "Your proposal", amount: "Amount (DZD)", cover_letter: "Cover letter — why you, specifically",
  cover_hint: "30+ characters of substance…", send_proposal_go: "Send proposal", proposal_sent: "Proposal sent",
  projects_back: "← Projects", confirm_completion: "Confirm completion", confirmed_waiting: "✓ You confirmed — waiting other side",
  completed: "Completed ✓", leave_review: "Leave a review",
  messages_h: "Messages", start_convo: "Start the conversation — scope, links, questions.", write_msg: "Write a message…",
  deliverables_h: "Deliverables", no_deliverables: "No deliverables yet.", attach: "Attach",
  milestones_h: "Milestones", add: "+ Add", deliver: "Deliver", approve: "Approve",
  break_work: "Break the work into milestones.",
  trust_flow: "Trust flow", client_confirm: "Client confirmation", freelancer_confirm: "Freelancer confirmation",
  completed_unlocked: "✓ Project completed — reviews unlocked", needs_both: "◦ Completion needs both confirmations",
  completed_t: "Completed", confirmed_t: "Confirmed — waiting the other side",
  review_sb: "Review", rating: "Rating", your_review: "Your review",
  review_hint: "How was the collaboration? Substance helps everyone.", publish_review: "Publish review",
  review_published: "Review published",
  ads_h: "Advertise on NAKSAB", ads_sub: "Reach professionals and clients while they work — clearly labeled, human-reviewed.",
  submit_campaign: "Submit a campaign for review", body: "Body", target_link: "Target link (https://)",
  media_link: "Media link (optional, https://)", submit_review_go: "Submit for review",
  signin_submit: "Sign in to submit a campaign.", live_sponsored: "Live sponsored", sponsored: "Sponsored",
  visit: "Visit", no_campaigns: "No approved campaigns yet.", submitted_pending: "Submitted — pending review.",
  about_h1: "About NAKSAB",
  about_product_h: "The product",
  about_product_p: "NAKSAB is a professional freelance marketplace: structured project requests, weighted matching, proposals, a real project room (messages, milestones, deliverables), and a reputation system anchored in mutually-confirmed completions. Free to join. No escrow, no payments — those arrive only with the right legal and payment rails, clearly announced.",
  about_trust_h: "Trust & Safety",
  about_trust_p: "Completion requires confirmation from both sides. Reviews can carry delivery evidence, suspicious patterns get flagged for human moderation, and everyone can appeal. Sponsored content is always labeled. Your private conversations never leave the platform.",
  about_tech_h: "Technology",
  about_tech_p: "NAKSAB runs on Cloudflare's global edge network, with continuous delivery through GitHub. Smart structuring is powered by Vito AI Hub — the in-house AI of Vito Byte Studio — with graceful fallback, so the marketplace keeps working even when smart features are busy.",
  designed_by: "Designed, built and operated by",
  admin_sub: "Platform health and moderation.",
  users: "Users", freelancers: "Freelancers", requests: "Requests", projects: "Projects", completed: "Completed", flagged: "Flagged reviews",
  tab_flagged: "Flagged reviews", tab_campaigns: "Campaigns", tab_users: "Users", tab_audit: "Audit",
  keep: "Keep", hide: "Hide", no_flagged: "No flagged reviews.",
  approve: "Approve", reject: "Reject", no_campaigns2: "No campaigns.",
  verify: "verify", verified: "✓ verified", ban: "ban", unban: "unban", no_audit: "No admin actions yet.",
  admins_only: "Admins only.",
  broke: "Something broke — try again.",
  ago_now: "just now", ago_m: "m ago", ago_h: "h ago", ago_d: "d ago",
  // pricing + setup + admin v2
  pricing: "Pricing", pricing_sub: "Start free. Paid tiers arrive soon — prices in Algerian Dinar.",
  free_forever: "Free forever", per_month: "/month", coming_soon: "Coming soon",
  choose_free: "Start free", current_plan: "Your plan",
  setup_title: "Owner setup — one time", setup_sub: "Create the administrator account and set your secret code. Your private panel link is minted once and shown a single time.",
  setup_name: "Owner name", setup_email: "Owner email", setup_pass: "Secret code (16+ chars, mixed)",
  setup_pass_hint: "Use a long mixed code — upper, lower, digits", setup_go: "Create owner account & mint panel link",
  panel_warn_title: "⚠ Save this link now — it is shown only once",
  panel_warn: "This is your private panel address. Bookmark it in your browser now. Combined with your secret code it is the only way in.",
  panel_copy: "Copy link", panel_open: "Open my panel",
  remember_me: "Keep me signed in on this device",
  ai_credits: "AI structuring", used_today: "Used today", quota_monthly: "This month",
  topup_soon: "Top-up in DZD — coming soon", plan_l: "Plan",
  admin_settings: "Settings", payments_tab: "Payments", devices_tab: "Devices", fin_audit: "Financial audit",
  payments_enabled_l: "Enable payments (charges real money)", ai_daily_l: "FREE daily AI limit",
  ai_monthly_l: "FREE monthly AI limit", credits_price_l: "Credits price (DZD / 100 calls)",
  webhook_secret_l: "Webhook secret", save_settings: "Save settings", settings_saved: "Settings saved.",
  no_payments: "No payments yet.", revoke: "Revoke", revoked_l: "revoked", last_seen: "Last seen",
  rotate_panel: "Rotate panel link", panel_rotated: "New link minted — save it now. The old one is dead.",
  admin_security_note: "Panel link + owner code + device binding + rate lockout — all active.",
  amount_dzd: "Amount (DZD)",
  errs: {
    invalid_email: "Enter a valid email.", invalid_k0: "Password must be 8+ chars with a digit.",
    email_taken: "This email is already registered.", username_taken: "This username is taken.",
    invalid_username: "Username: 3-24 lowercase letters, numbers or dashes.",
    invalid_credentials: "Wrong email or password.", csrf: "Session expired — try again.",
    auth_required: "Please sign in first.", freelancer_only: "Only freelancer accounts can do this.",
    too_many: "Too many attempts — wait a moment.", ai_unavailable: "Vito AI is busy right now — use the manual form below.",
    project_not_completed: "You can review after both sides confirm completion.",
    already_reviewed: "You already reviewed this project.", already_proposed: "You already sent a proposal here.",
    invalid_url: "Enter a valid https:// link.", forbidden: "Not allowed.",
    payments_disabled: "Payments are not open yet — coming soon.",
    invalid_setup: "Check the fields — code must be 16+ mixed characters.",
    not_buyable: "This plan is not open for purchase yet.",
    duplicate_transaction: "This transaction was already processed.",
    amount_mismatch: "Amount does not match the reference exactly.",
    invalid_transition: "This status change is not allowed.",
  },
},
ar: {
  tagline: "وظِّف الموهبة المناسبة، بثقة",
  h1a: "وظِّف الموهبة المناسبة،", h1b: "بثقة.",
  lead: "صِف مشروعك بكلمات بسيطة. يتولى NAKSAB هيكلته، ويوصلك بالمحترفين المناسبين، ويدير التعاون كله — العروض والمراحل والتسليمات والتقييمات — في مساحة عمل واحدة صادقة.",
  hero_badge: "المرحلة الأولى لايف — وصول مبكر",
  built_on: "مبني على تقنيات بدرجة إنتاج",
  how_eyebrow: "كيف يعمل", how_title: "من فكرة إلى تسليم، في ثلاث خطوات",
  step1_t: "صِف مشروعك", step1_d: "اللغة البسيطة كافية. يهيكل ذكاؤنا الطلب إلى طلب واضح واحترافي — الميزانية والمتطلبات تبقى بيدك.",
  step2_t: "مطابقة مدروسة لا إزعاج", step2_d: "محرك مطابقة موزون يرتّب المحترفين الأنسب حسب المهارات والتوفر والسمعة. أنت تختار من يرى مشروعك.",
  step3_t: "تنفيذ بدليل", step3_d: "مراحل ورسائل وتسليمات في غرفة واحدة. الاكتمال يتطلب تأكيد الطرفين — لتبقى التقييمات صادقة.",
  cats_eyebrow: "التصنيفات", cats_title: "كل حرفة، في سوق واحد",
  talent_eyebrow: "محترفون مختارون", talent_title: "مواهب تُنجز", browse_all: "تصفح كل المواهب →",
  cta_title: "جاهزون حين تكون جاهزاً.", cta_sub: "انضم إلى الموجة الأولى من المحترفين والعملاء الذين يبنون على NAKSAB.",
  create_profile: "أنشئ ملفك", about_naksab: "عن NAKSAB",
  mock_t: "طلب جديد", mock_d: "«صفحة هبوط لمنصتي — الميزانية 300$، خلال أسبوعين.»",
  mock_matches: "أفضل المطابقات", mock_hired: "تم التعاقد — فُتحت غرفة المشروع",
  mock_note: "معاينة حية لتجربة NAKSAB",
  st_freelancers: "مستقل", st_services: "خدمة نشطة", st_categories: "تصنيفاً", st_real: "تعاون حقيقي",
  explore: "استكشف المواهب", post_project: "اعرض مشروعك", get_started: "ابدأ الآن", sign_in: "تسجيل الدخول", sign_out: "تسجيل الخروج",
  browse_talent: "تصفح المواهب", services: "الخدمات", discover: "استكشاف", dashboard: "لوحة التحكم", admin: "الإدارة", notifications: "الإشعارات",
  create_account: "أنشئ حسابك", welcome_back: "أهلاً بعودتك",
  email: "البريد الإلكتروني", password: "كلمة المرور", full_name: "الاسم الكامل", username: "اسم المستخدم", role: "أنا",
  freelancer: "مستقل", client: "عميل",
  save: "حفظ", cancel: "إلغاء", send: "إرسال", loading: "جارٍ التحميل…", search: "ابحث…",
  all_categories: "كل التصنيفات", no_results: "لا شيء هنا بعد.",
  foot_desc: "السوق الاحترافي الذي تلتقي فيه الموهبة بالفرصة — مطابقة وإدارة مشاريع وسمعة في مساحة عمل واحدة صادقة.",
  foot_market: "السوق", foot_account: "الحساب", foot_platform: "المنصة",
  f_talent: "تصفح المواهب", f_post: "اعرض مشروعك", f_join: "انضم كمستقل", f_hire: "وظّف موهبة",
  f_dash: "لوحة التحكم", f_ads: "أعلن معنا", f_about: "عن المنصة", f_trust: "الثقة والسلامة",
  a_product_by: "منتج من", rights: "جميع الحقوق محفوظة.",
  pass_hint: "8 أحرف فأكثر وتضم رقماً", securing: "جارٍ التأمين…",
  no_account: "جديد على NAKSAB؟", have_account: "عضو بالفعل؟",
  welcome_toast: "أهلاً",
  all_caught: "لا جديد.",
  available: "متاح", busy: "مشغول", n_projects: "مشروعاً",
  talent_sub: "محترفون يبنون سمعتهم بمشاريع حقيقية.",
  services_sub: "عروض محددة النطاق بأسعار ومدد تسليم واضحة.",
  by: "بواسطة", d_delivery: "يوم تسليم", view_profile: "عرض الملف والتواصل",
  requirements: "المتطلبات", days_delivery: "يوم تسليم", revisions: "تعديلات",
  joined: "عضو منذ", completed_projects: "مشروعاً مكتملة",
  follow: "متابعة", following: "تتم المتابعة", hire_me: "وظّفني",
  about_h: "نبذة", no_bio: "لا نبذة بعد.", services_h: "الخدمات", no_services: "لا خدمات بعد.",
  portfolio_h: "أعمال", no_works: "لا نماذج عمل بعد.", reviews_h: "التقييمات", no_reviews: "لا تقييمات بعد.",
  discover_sub: "تغذية احترافية — عمل حقيقي وإنجازات حقيقية، بلا ضجيج.",
  all: "الكل", work: "أعمال", achievement: "إنجازات", post: "منشورات",
  share_work: "+ شارك عملاً", signin_interact: "سجّل الدخول للتفاعل",
  share_your_work: "شارك عملك", title: "العنوان", description: "الوصف", type: "النوع",
  media_type: "نوع الوسائط", image_link: "رابط صورة", video_link: "رابط فيديو (YouTube/Vimeo/مباشر)",
  media_url: "رابط الوسائط (https://)", thumb_url: "رابط المصغرة (اختياري)", publish: "نشر",
  published_t: "تم النشر",
  dash_sub_admin: "تحكم بالمنصة.", dash_sub_freelancer: "حضورك المهني وخط أعمالك.", dash_sub_client: "مشاريعك وطلباتك.",
  tab_profile: "الملف", tab_services: "خدماتي", tab_open: "الطلبات المفتوحة", tab_proposals: "عروضي", tab_requests: "طلباتي", tab_portfolio: "أعمالي", tab_projects: "المشاريع",
  headline: "العنوان المهني", country: "البلد", bio: "نبذة",
  cats_hint: "التصنيفات (مفصولة بفواصل)", skills_hint: "المهارات (مفصولة بفواصل)",
  avatar_url: "رابط الصورة (https://)", status: "الحالة", avail_work: "متاح للعمل",
  profile_saved: "حُفظ الملف.", saved_t: "تم الحفظ",
  n_services: "خدمة", new_service: "+ خدمة جديدة", no_services_yet: "لا خدمات بعد — أنشئ أول عرض لك.",
  nothing_shared: "لم تشارك شيئاً بعد.",
  n_requests: "طلب", new_request: "+ طلب جديد", no_requests: "لا طلبات بعد.",
  proposals_c: "عرض", budget: "الميزانية", open: "مفتوح",
  open_ranked: "مرتبة لملفك — أرسل عرضاً فقط حيث تناسبك فعلاً.",
  propose: "قدّم عرضاً", no_open: "لا طلبات مفتوحة الآن — عود قريباً.",
  proposals_hint: "الطلبات المفتوحة التي تستجيب لها ستظهر بحالتها هنا.",
  with: "مع", no_projects: "لا مشاريع بعد.",
  new_service_t: "خدمة جديدة", category: "التصنيف", currency: "العملة",
  price_from: "السعر من", price_to: "إلى", delivery_days: "التسليم (أيام)", revisions_n: "التعديلات",
  skills_csv: "المهارات (مفصولة بفواصل)", req_buyer: "متطلبات من المشتري",
  publish_service: "انشر الخدمة", service_published: "نُشرت الخدمة",
  post_sub: "صِفه بكلمات بسيطة — يحوّله ذكاؤنا إلى طلب مهيكل. النموذج اليدوي متاح دائماً.",
  describe: "صِف مشروعك",
  raw_hint: "أحتاج صفحة هبوط لمنصتي مع قسم أسعار ونموذج تواصل. الميزانية حوالي 300$، خلال أسبوعين…",
  ai_structure: "✦ هيكله بـVito AI", write_first: "اكتب جملة واحدة على الأقل أولاً.", analyzing: "جارٍ التحليل…",
  ai_down: "الذكاء غير متاح الآن — املأ النموذج يدوياً أدناه، كل شيء يعمل.",
  structured_via: "هُيكل عبر", clarify: "وضّح:", review_publish: "راجع وانشر.",
  full_description: "الوصف الكامل", budget_from: "الميزانية من", budget_to: "إلى", skills_needed: "المهارات المطلوبة (مفصولة بفواصل)",
  publish_request: "انشر الطلب", request_published: "نُشر الطلب — بدأت المطابقة",
  project_request: "طلب مشروع",
  top_matches: "أفضل المطابقات", weighted_by: "— موزونة بالمهارات والتوفر والسمعة",
  no_matches: "لا مطابقات مرتبة بعد — وسّع طلبك.",
  proposals: "العروض", no_proposals: "لا عروض بعد — أُشعر المطابقون بترتيبهم ضمنياً.",
  accept_open: "اقبل وافتح مشروعاً", open_room: "افتح غرفة المشروع →", close_request: "أغلق هذا الطلب",
  project_created: "أُنشئ المشروع", your_proposal_is: "عرضك", send_proposal: "أرسل عرضاً",
  owner_only: "سجّل دخولك كصاحب الطلب لإدارته.",
  your_proposal: "عرضك", amount: "المبلغ (دج)", cover_letter: "رسالة العرض — لماذا أنت تحديداً",
  cover_hint: "30+ حرفاً من الجوهر…", send_proposal_go: "أرسل العرض", proposal_sent: "أُرسل العرض",
  projects_back: "← المشاريع", confirm_completion: "أكّد الاكتمال", confirmed_waiting: "✓ أكّدت — بانتظار الطرف الآخر",
  completed: "مكتمل ✓", leave_review: "اكتب تقييماً",
  messages_h: "الرسائل", start_convo: "ابدأ المحادثة — النطاق والروابط والأسئلة.", write_msg: "اكتب رسالة…",
  deliverables_h: "التسليمات", no_deliverables: "لا تسليمات بعد.", attach: "إرفاق",
  milestones_h: "المراحل", add: "+ إضافة", deliver: "تسليم", approve: "اعتماد",
  break_work: "قسّم العمل إلى مراحل.",
  trust_flow: "مسار الثقة", client_confirm: "تأكيد العميل", freelancer_confirm: "تأكيد المستقل",
  completed_unlocked: "✓ اكتمل المشروع — فُتحت التقييمات", needs_both: "◦ الاكتمال يتطلب تأكيد الطرفين",
  completed_t: "اكتمل", confirmed_t: "أُكّد — بانتظار الطرف الآخر",
  review_sb: "تقييم", rating: "التقييم", your_review: "تقييمك",
  review_hint: "كيف كان التعاون؟ الجوهر ينفع الجميع.", publish_review: "انشر التقييم",
  review_published: "نُشر التقييم",
  ads_h: "أعلن على NAKSAB", ads_sub: "ابلغ المحترفين والعملاء أثناء عملهم — موسومة بوضوح ومراجعة بشرياً.",
  submit_campaign: "أرسل حملة للمراجعة", body: "النص", target_link: "رابط الهدف (https://)",
  media_link: "رابط الوسائط (اختياري، https://)", submit_review_go: "أرسل للمراجعة",
  signin_submit: "سجّل الدخول لإرسال حملة.", live_sponsored: "رعاية نشطة", sponsored: "برعاية",
  visit: "زيارة", no_campaigns: "لا حملات معتمدة بعد.", submitted_pending: "أُرسلت — بانتظار المراجعة.",
  about_h1: "عن NAKSAB",
  about_product_h: "المنتج",
  about_product_p: "NAKSAB سوق عمل حر احترافي: طلبات مشاريع مهيكلة، مطابقة موزونة، عروض، غرفة مشروع حقيقية (رسائل ومراحل وتسليمات)، ونظام سمعة مرتكز على اكتمال مؤكَّد من الطرفين. الانضمام مجاني. بلا escrow ولا مدفوعات — تأتي فقط عند توفر القنوات القانونية ومرافق الدفع الصحيحة، بإعلان واضح.",
  about_trust_h: "الثقة والسلامة",
  about_trust_p: "الاكتمال يتطلب تأكيد الطرفين. التقييمات قد تحمل دليل تسليم، والأنماط المشبوهة تُعلَّم لمراجعة بشرية، ولكل طرف حق الاعتراض. المحتوى الممول موسوم دائماً. محادثاتك الخاصة لا تغادر المنصة.",
  about_tech_h: "التقنية",
  about_tech_p: "يعمل NAKSAB على شبكة Cloudflare الحافية عالمياً، مع نشر متصل عبر GitHub. الهيكلة الذكية مدعومة بـVito AI Hub — الذكاء الخاص من VITO BYTE STUDIO — مع بدائل تلقائية، ليبقى السوق عاملاً حتى عند انشغال الميزات الذكية.",
  designed_by: "تصميم وبناء وتشغيل",
  admin_sub: "صحة المنصة والمراجعة.",
  users: "مستخدمون", freelancers: "مستقلون", requests: "طلبات", projects: "مشاريع", completed: "مكتملة", flagged: "تقييمات معلَّمة",
  tab_flagged: "تقييمات معلَّمة", tab_campaigns: "الحملات", tab_users: "المستخدمون", tab_audit: "سجل التدقيق",
  keep: "إبقاء", hide: "إخفاء", no_flagged: "لا تقييمات معلَّمة.",
  approve: "اعتماد", reject: "رفض", no_campaigns2: "لا حملات.",
  verify: "توثيق", verified: "✓ موثّق", ban: "حظر", unban: "رفع الحظر", no_audit: "لا إجراءات إدارية بعد.",
  admins_only: "للمديرين فقط.",
  broke: "حدث خلل — حاول مجدداً.",
  ago_now: "الآن", ago_m: " د قبل", ago_h: " س قبل", ago_d: " ي قبل",
  // pricing + setup + admin v2
  pricing: "الأسعار", pricing_sub: "ابدأ مجاناً. الباقات المدفوعة قريباً — الأسعار بالدينار الجزائري.",
  free_forever: "مجاني للأبد", per_month: "/شهر", coming_soon: "قريباً",
  choose_free: "ابدأ مجاناً", current_plan: "باقتك",
  setup_title: "إعداد المالك — مرة واحدة", setup_sub: "أنشئ حساب المدير وضع رمزك السري. رابط لوحتك الخاصة يُشتق مرة واحدة ويُعرض مرة واحدة فقط.",
  setup_name: "اسم المالك", setup_email: "بريد المالك", setup_pass: "الرمز السري (16+ محرفاً مختلطاً)",
  setup_pass_hint: "استخدم رمزاً طويلاً مختلطاً — أحرف كبيرة وصغيرة وأرقام", setup_go: "أنشئ حساب المالك واشتق رابط اللوحة",
  panel_warn_title: "⚠ احفظ هذا الرابط الآن — يُعرض مرة واحدة فقط",
  panel_warn: "هذا عنوان لوحتك الخاصة. أضفه للمفضلة في متصفحك الآن. هو مع رمزك السري الطريق الوحيد للدخول.",
  panel_copy: "انسخ الرابط", panel_open: "افتح لوحتي",
  remember_me: "أبقني مسجلاً على هذا الجهاز",
  ai_credits: "الهيكلة الذكية", used_today: "استُخدم اليوم", quota_monthly: "هذا الشهر",
  topup_soon: "شحن بالدينار — قريباً", plan_l: "الباقة",
  admin_settings: "الإعدادات", payments_tab: "المدفوعات", devices_tab: "الأجهزة", fin_audit: "التدقيق المالي",
  payments_enabled_l: "تفعيل الدفع (يحصّل أموالاً حقيقية)", ai_daily_l: "حد الذكاء اليومي لـFREE",
  ai_monthly_l: "حد الذكاء الشهري لـFREE", credits_price_l: "سعر الرصيد (دج / 100 عملية)",
  webhook_secret_l: "سر الـWebhook", save_settings: "حفظ الإعدادات", settings_saved: "حُفظت الإعدادات.",
  no_payments: "لا مدفوعات بعد.", revoke: "إبطال", revoked_l: "مُبطل", last_seen: "آخر ظهور",
  rotate_panel: "تدوير رابط اللوحة", panel_rotated: "رابط جديد اشتُق — احفظه الآن. القديم مات.",
  admin_security_note: "رابط اللوحة + رمز المالك + ربط الجهاز + قفل المحاولات — كلها نشطة.",
  amount_dzd: "المبلغ (دج)",
  errs: {
    invalid_email: "أدخل بريداً إلكترونياً صالحاً.", invalid_k0: "كلمة المرور: 8 أحرف فأكثر وتضم رقماً.",
    email_taken: "هذا البريد مسجل مسبقاً.", username_taken: "اسم المستخدم محجوز.",
    invalid_username: "اسم المستخدم: 3–24 حرفاً صغيراً أو أرقاماً أو شرطات.",
    invalid_credentials: "بريد أو كلمة مرور خاطئة.", csrf: "انتهت الجلسة — حاول مجدداً.",
    auth_required: "سجّل دخولك أولاً.", freelancer_only: "هذا الإجراء لحسابات المستقلين فقط.",
    too_many: "محاولات كثيرة — انتظر قليلاً.", ai_unavailable: "Vito AI مشغول الآن — استخدم النموذج اليدوي أدناه.",
    project_not_completed: "التقييم بعد تأكيد الطرفين للاكتمال.",
    already_reviewed: "قيّمت هذا المشروع مسبقاً.", already_proposed: "أرسلت عرضاً هنا مسبقاً.",
    invalid_url: "أدخل رابط https صالحاً.", forbidden: "غير مسموح.",
    payments_disabled: "الدفع غير مفتوح بعد — قريباً.",
    invalid_setup: "تحقق من الحقول — الرمز يجب أن يكون 16+ مختلطاً.",
    not_buyable: "هذه الباقة غير مفتوحة للشراء بعد.",
    duplicate_transaction: "هذه العملية عولجت مسبقاً.",
    amount_mismatch: "المبلغ لا يطابق المرجع تماماً.",
    invalid_transition: "تغيير الحالة هذا غير مسموح.",
  },
},
};

// ─── حالة ───
let _savedLang = "en"; try { _savedLang = localStorage.getItem("nk_lang") || "en"; } catch {}
const S = { user: null, csrf: null, cats: [], lang: L[_savedLang] ? _savedLang : "en", panel: "", plan: null, ai: null };
// T: وكيل يقرأ من لغة الجلسة — كل الواجهات القائمة تظل تعمل بلا تغيير
const T = new Proxy({}, { get: (_, k) => (L[S.lang] && L[S.lang][k] !== undefined ? L[S.lang][k] : L.en[k] ?? "") });
function setLang(l) {
  S.lang = l; try { localStorage.setItem("nk_lang", l); } catch {}
  document.documentElement.lang = l;
  document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  route();
}
const $app = document.getElementById("app");
const enc = new TextEncoder();

// ─── أدوات ───
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const money = (n) => `${Number(n || 0).toLocaleString(S.lang === "ar" ? "ar-DZ" : "en-US")} ${S.lang === "ar" ? "دج" : "DZD"}`;
const ago = (ts) => { const d = Date.now() - ts; const m = 6e4, h = 36e5, day = 864e5; if (d < m) return T.ago_now; if (d < h) return `${Math.floor(d / m)}${T.ago_m}`; if (d < day) return `${Math.floor(d / h)}${T.ago_h}`; return `${Math.floor(d / day)}${T.ago_d}`; };
const stars = (r) => "★".repeat(Math.round(r || 0)) + "☆".repeat(5 - Math.round(r || 0));

function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2600);
}

async function api(path, method = "GET", body) {
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json", ...(S.csrf && method !== "GET" ? { "x-csrf": S.csrf } : {}), ...(S.panel ? { "x-panel": S.panel } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

// k0 — عقد التمطيط: 200k في المتصفح
async function k0Of(email, password) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("naksab:a1:" + email.toLowerCase()), iterations: 200000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const errText = (e) => (L[S.lang].errs[e] || (L.en.errs[e] ?? "") || (String(e || "").length < 24 ? e : "") || (S.lang === "ar" ? "حدث خطأ ما." : "Something went wrong."));

// ─── Reveal on scroll ───
const io = new IntersectionObserver((es) => es.forEach((x) => x.isIntersecting && x.target.classList.add("in")), { threshold: 0.12 });
function observeReveals(root = document) { $$(".reveal", root).forEach((el) => io.observe(el)); }

// ─── حركات عامة: شريط تقدم + بقعة ضوء على البطاقات ───
function wireFx() {
  const bar = document.querySelector("#progress span");
  if (bar && !bar._wired) {
    bar._wired = 1;
    addEventListener("scroll", () => { const h = document.documentElement; bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100 + "%"; }, { passive: true });
  }
  if (!document._spot) {
    document._spot = 1;
    document.addEventListener("pointermove", (e) => {
      const c = e.target && e.target.closest ? e.target.closest(".card.hover") : null;
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      c.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    }, { passive: true });
  }
}

// ─── Avatar ───
function avatarHtml(name, url, cls = "") {
  const initial = esc((name || "?").trim()[0].toUpperCase());
  return `<span class="avatar ${cls}">${url ? `<img src="${esc(url)}" alt="" loading="lazy" onerror="this.remove()">` : initial}</span>`;
}

// ═══════════ الصدفة: nav + footer ═══════════
function shell(content, active = "") {
  const navLinks = [
    ["#/talent", T.browse_talent, "talent"],
    ["#/services", T.services, "services"],
    ["#/discover", T.discover, "discover"],
    ["#/pricing", T.pricing, "pricing"],
  ];
  $app.innerHTML = `
  <nav class="nav"><div class="wrap nav-in">
    <a class="logo" href="#/"><span class="logo-mark">N</span>NAKSAB</a>
    <div class="nav-links ${active === "home" ? "" : ""}" id="navlinks">
      ${navLinks.map(([h, l, k]) => `<a href="${h}" class="${active === k ? "on" : ""}">${l}</a>`).join("")}
      ${S.user ? `<a href="#/dashboard" class="${active === "dashboard" ? "on" : ""}">${T.dashboard}</a>` : ""}
      ${S.user?.role === "admin" && S.panel ? `<a href="#/admin" class="${active === "admin" ? "on" : ""}">${T.admin}</a>` : ""}
    </div>
    <div class="nav-cta">
      ${S.user ? `
        <button class="btn ghost sm" id="n-notif" title="${T.notifications}">◦<span id="notif-dot" hidden></span></button>
        <a class="btn ghost sm" href="#/dashboard">${esc(S.user.name.split(" ")[0])}</a>
        <button class="btn sm" id="n-out">${T.sign_out}</button>` : `
        <button class="btn ghost sm" id="n-in">${T.sign_in}</button>
        <button class="btn primary sm" id="n-up">${T.get_started}</button>`}
      <button class="lang-toggle" id="n-lang" title="Language / اللغة">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        ${S.lang === "en" ? "العربية" : "English"}</button>
      <button class="burger" id="n-burger" aria-label="Menu">≡</button>
    </div>
  </div></nav>
  <main id="view">${content}</main>
  ${footerHtml()}
  <div class="modal-bg" id="modal" hidden></div>`;
  $("#n-out")?.addEventListener("click", async () => { await api("/api/auth/logout", "POST", {}); S.user = null; S.csrf = null; location.hash = "#/"; route(); });
  $("#n-in")?.addEventListener("click", () => authModal("login"));
  $("#n-up")?.addEventListener("click", () => authModal("register"));
  $("#n-burger")?.addEventListener("click", () => $("#navlinks").classList.toggle("open"));
  $("#n-notif")?.addEventListener("click", showNotifications);
  $("#n-lang")?.addEventListener("click", () => setLang(S.lang === "en" ? "ar" : "en"));
  observeReveals();
  wireFx();
}

function footerHtml() {
  return `<footer><div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <a class="logo" href="#/"><span class="logo-mark">N</span>NAKSAB</a>
        <p>${T.foot_desc}</p>
        <div class="studio">
          <span class="s-mark">V</span>
          <span class="s-name">${T.a_product_by}<b>VITO BYTE STUDIO</b></span>
        </div>
      </div>
      <div class="foot-col"><h4>${T.foot_market}</h4>
        <a href="#/talent">${T.f_talent}</a><a href="#/services">${T.services}</a><a href="#/discover">${T.discover}</a><a href="#/request/new">${T.f_post}</a>
      </div>
      <div class="foot-col"><h4>${T.foot_account}</h4>
        <a href="#/dashboard">${T.f_dash}</a><a href="#" data-auth="register">${T.f_join}</a><a href="#" data-auth="register">${T.f_hire}</a>
      </div>
      <div class="foot-col"><h4>${T.foot_platform}</h4>
        <a href="#/ads">${T.f_ads}</a><a href="#/pricing">${T.pricing}</a><a href="#/about">${T.f_about}</a><a href="#/about">${T.f_trust}</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© ${new Date().getFullYear()} NAKSAB — Vito Byte Studio. ${T.rights}</span>
      <span>EN · AR · FR (soon)</span>
    </div>
  </div></footer>`;
}

// ═══════════ المصادقة ═══════════
function authModal(mode) {
  const m = $("#modal");
  m.hidden = false;
  m.innerHTML = `<div class="modal">
    <div class="spread" style="margin-bottom:18px"><b style="font-size:17px">${mode === "login" ? T.welcome_back : T.create_account}</b><button class="btn ghost sm" id="m-x">✕</button></div>
    <div class="field"><label>${T.email}</label><input id="a-email" type="email" autocomplete="email" /></div>
    <div class="field"><label>${T.password}</label><input id="a-pass" type="password" placeholder="${T.pass_hint}" /></div>
    ${mode === "register" ? `
    <div class="form-2">
      <div class="field"><label>${T.full_name}</label><input id="a-name" /></div>
      <div class="field"><label>${T.username}</label><input id="a-user" placeholder="lowercase-username" dir="ltr" /></div>
    </div>
    <div class="field"><label>${T.role}</label><select id="a-role"><option value="freelancer">${T.freelancer}</option><option value="client">${T.client}</option></select></div>` : ""}
    <button class="btn primary" id="a-go" style="width:100%;justify-content:center;margin-top:6px">${mode === "login" ? T.sign_in : T.get_started}</button>
    ${mode === "login" ? `<label class="tiny muted" style="display:flex;gap:8px;align-items:center;margin-top:10px;cursor:pointer"><input type="checkbox" id="a-rem" checked style="width:auto" /> ${T.remember_me}</label>` : ""}
    <div class="msg" id="a-msg" hidden></div>
    <p class="tiny muted center" style="margin-top:14px">${mode === "login" ? `${T.no_account} <a href="#" id="m-swap" style="color:var(--brand2)">${T.create_account}</a>` : `${T.have_account} <a href="#" id="m-swap" style="color:var(--brand2)">${T.sign_in}</a>`}</p>
  </div>`;
  $("#m-x").onclick = () => (m.hidden = true);
  m.onclick = (e) => { if (e.target === m) m.hidden = true; };
  $("#m-swap").onclick = (e) => { e.preventDefault(); authModal(mode === "login" ? "register" : "login"); };
  $("#a-go").onclick = async () => {
    const btn = $("#a-go"), msg = $("#a-msg");
    const email = $("#a-email").value.trim(), pass = $("#a-pass").value;
    btn.disabled = true; btn.textContent = T.securing; msg.hidden = true;
    try {
      if (!pass || pass.length < 8 || !/\d/.test(pass)) throw "invalid_k0";
      const k0 = await k0Of(email, pass);
      let r;
      if (mode === "login") r = await api("/api/auth/login", "POST", { email, k0, remember: $("#a-rem") ? $("#a-rem").checked : true });
      else {
        const name = $("#a-name").value.trim(), username = $("#a-user").value.trim().toLowerCase(), role = $("#a-role").value;
        if (name.length < 2) throw "invalid_name";
        r = await api("/api/auth/register", "POST", { email, k0, name, username, role });
      }
      if (!r.ok) throw r.data.error || "error";
      if (r.data.error === "legacy") throw "Please re-register — security upgrade in progress.";
      S.user = r.data.user; S.csrf = r.data.csrf;
      m.hidden = true;
      toast(`${T.welcome_toast}, ${S.user.name.split(" ")[0]}`);
      route();
    } catch (e2) {
      msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(String(e2));
      btn.disabled = false; btn.textContent = mode === "login" ? T.sign_in : T.get_started;
    }
  };
}

async function showNotifications() {
  const r = await api("/api/notifications");
  const m = $("#modal");
  m.hidden = false;
  m.innerHTML = `<div class="modal"><div class="spread" style="margin-bottom:14px"><b>${T.notifications}</b><button class="btn ghost sm" onclick="document.getElementById('modal').hidden=true">✕</button></div>
    ${(r.data.notifications || []).map((n) => `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="tiny muted">${ago(n.created_at)}</div><div style="font-size:13.5px">${esc(n.body)}</div></div>`).join("") || `<div class="empty">${T.all_caught}</div>`}
  </div>`;
}

// ═══════════ الصفحة الرئيسية ═══════════
const TECHS = [
  ["Cloudflare", "#f38020", "CF"], ["GitHub", "#e6edf3", "GH"], ["Vito AI Hub", "#7c6cff", "V"],
];

async function viewHome() {
  shell(`
  <section class="hero">
    <div class="hero-bg"><div class="grid-lines"></div><div class="orb orb-1"></div><div class="orb orb-2"></div><div class="orb orb-3"></div></div>
    <div class="wrap hero-grid">
      <div class="hero-in">
        <div class="hero-badge reveal"><span class="dot"></span> ${T.hero_badge}</div>
        <h1 class="reveal">${T.h1a}<br><span class="grad">${T.h1b}</span></h1>
        <p class="lead reveal">${T.lead}</p>
        <div class="hero-cta reveal">
          <a class="btn primary" href="#/request/new">${T.post_project} →</a>
          <a class="btn" href="#/talent">${T.explore}</a>
        </div>
        <div class="hero-stats reveal">
          <div class="stat"><b data-count="${Math.max(6, (S._stats?.freelancers ?? 6))}">0</b><span>${T.st_freelancers}</span></div>
          <div class="stat"><b data-count="${Math.max(4, (S._stats?.services ?? 4))}">0</b><span>${T.st_services}</span></div>
          <div class="stat"><b data-count="${Math.max(2, (S._stats?.categories ?? 8))}">0</b><span>${T.st_categories}</span></div>
          <div class="stat"><b>100%</b><span>${T.st_real}</span></div>
        </div>
      </div>
      <div class="hero-visual reveal" aria-hidden="true">
        <div class="mock-ring"></div>
        <div class="mock">
          <div class="mock-bar"><i></i><i></i><i></i></div>
          <div class="mock-req"><b>${T.mock_t}</b><br>${T.mock_d}</div>
          <div class="mock-label">${T.mock_matches}</div>
          <div class="mock-match"><span class="m-av" style="background:linear-gradient(135deg,#7c6cff,#4834d0)">A</span><span><span class="m-name">Amine K.</span><br><span class="m-sub">React · Node · 12 ${T.n_projects}</span></span><span class="mock-score"><b>98</b><span class="bar"><i></i></span></span></div>
          <div class="mock-match"><span class="m-av" style="background:linear-gradient(135deg,#00d4ff,#0891b2)">S</span><span><span class="m-name">Sara M.</span><br><span class="m-sub">UI Design · Branding · 8 ${T.n_projects}</span></span><span class="mock-score"><b>91</b><span class="bar"><i></i></span></span></div>
          <div class="mock-match"><span class="m-av" style="background:linear-gradient(135deg,#ff6cb5,#be185d)">Y</span><span><span class="m-name">Yacine B.</span><br><span class="m-sub">SEO · Content · 21 ${T.n_projects}</span></span><span class="mock-score"><b>84</b><span class="bar"><i></i></span></span></div>
        </div>
        <div class="mock-ok">${T.mock_hired}</div>
      </div>
    </div>
  </section>

  <section class="marquee-sec">
    <div class="wrap"><div class="marquee-label">${T.built_on}</div>
      <div class="marquee"><div class="marquee-track">
        ${[...TECHS, ...TECHS].map(([name, color, mark]) => `<span class="tech"><span class="mark" style="background:${color}22;border:1px solid ${color}55;color:${color}">${mark}</span>${name}</span>`).join("")}
      </div></div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">${T.how_eyebrow}</span><h2>${T.how_title}</h2></div>
      <div class="steps stagger reveal">
        <div class="card step reveal" style="--i:0"><span class="num">01</span><div class="ic">✎</div><h3>${T.step1_t}</h3><p>${T.step1_d}</p></div>
        <div class="card step reveal" style="--i:1"><span class="num">02</span><div class="ic">◎</div><h3>${T.step2_t}</h3><p>${T.step2_d}</p></div>
        <div class="card step reveal" style="--i:2"><span class="num">03</span><div class="ic">✓</div><h3>${T.step3_t}</h3><p>${T.step3_d}</p></div>
      </div>
    </div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">${T.cats_eyebrow}</span><h2>${T.cats_title}</h2></div>
      <div class="t-grid stagger" id="home-cats"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>
    </div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap">
      <div class="sec-head reveal"><span class="eyebrow">${T.talent_eyebrow}</span><h2>${T.talent_title}</h2></div>
      <div class="t-grid" id="home-talent"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>
      <div class="center" style="margin-top:26px"><a class="btn" href="#/talent">${T.browse_all}</a></div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap"><div class="panel reveal center" style="padding:52px 30px;position:relative;overflow:hidden">
      <div class="orb orb-1" style="opacity:.25"></div>
      <h2 style="position:relative">${T.cta_title}</h2>
      <p class="muted" style="margin:12px auto 26px;max-width:460px;position:relative">${T.cta_sub}</p>
      <div class="row" style="justify-content:center;position:relative">
        <button class="btn primary" id="cta-up" style="padding:12px 24px">${T.create_profile}</button>
        <a class="btn" href="#/about" style="padding:12px 24px">${T.about_naksab}</a>
      </div>
    </div></div>
  </section>`, "home");

  // البيانات
  api("/api/categories").then((r) => {
    S.cats = r.data.categories || [];
    $("#home-cats").innerHTML = S.cats.map((c) => `<a class="card hover card-pad reveal in" href="#/talent?category=${c.slug}" style="display:flex;gap:14px;align-items:center">
      <span style="font-size:20px;color:var(--brand2)">${esc(c.icon || "◆")}</span><span><b style="font-size:14px">${esc(c.name)}</b><span class="tiny muted" style="display:block">${c.slug}</span></span></a>`).join("");
  });
  api("/api/freelancers").then((r) => {
    S._stats = S._stats || {};
    S._stats.freelancers = (r.data.freelancers || []).length;
    $("#home-talent").innerHTML = (r.data.freelancers || []).slice(0, 6).map(talentCard).join("") || `<div class="empty">${T.no_results}</div>`;
  });
  api("/api/services").then((r) => { S._stats = S._stats || {}; S._stats.services = (r.data.services || []).length; });
  $("#cta-up")?.addEventListener("click", () => S.user ? (location.hash = "#/dashboard") : authModal("register"));
  animateCounts();
}

function animateCounts() {
  $$("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count || 0);
    if (!target) { el.textContent = "—"; return; }
    const t0 = performance.now(), dur = 1100;
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(target * (0.2 + 0.8 * p * p)); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}

function talentCard(u) {
  return `<a class="card hover t-card reveal" href="#/u/${esc(u.username)}">
    <div class="t-top">${avatarHtml(u.name, u.avatar_url)}
      <div><div class="t-name">${esc(u.name)} ${u.verified ? '<span class="verified">✓</span>' : ""}</div>
      <div class="t-sub">@${esc(u.username)}${u.country ? " · " + esc(u.country) : ""}</div></div>
      <span class="chip ${u.available ? "ok" : ""}" style="margin-inline-start:auto">${u.available ? T.available : T.busy}</span>
    </div>
    <div style="font-size:13px;color:var(--dim);min-height:34px">${esc(u.headline || "")}</div>
    <div class="chips">${jsonChips(u.skills, 4)}</div>
    <div class="svc-price"><span class="stars">${stars(u.reputation)} <span class="tiny muted">${u.reviews_count || 0}</span></span><span class="tiny muted">${u.completed || 0} ${T.n_projects}</span></div>
  </a>`;
}
const jsonChips = (s, n) => { try { return (JSON.parse(s || "[]") || []).slice(0, n).map((x) => `<span class="chip">${esc(x)}</span>`).join(""); } catch { return ""; } };

// ═══════════ استكشاف المواهب ═══════════
async function viewTalent(params) {
  shell(`<div class="wrap page-head"><h1>${T.browse_talent}</h1><p>${T.talent_sub}</p></div>
  <div class="wrap"><div class="toolbar">
    <input id="q" placeholder="${T.search}" value="${esc(params.get("q") || "")}" />
    <select id="cat"><option value="">${T.all_categories}</option>${S.cats.map((c) => `<option value="${c.slug}" ${params.get("category") === c.slug ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
  </div><div class="t-grid" id="list"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div></div>`, "talent");
  const load = async () => {
    const q = $("#q").value.trim(), cat = $("#cat").value;
    const r = await api(`/api/freelancers?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`);
    $("#list").innerHTML = (r.data.freelancers || []).map(talentCard).join("") || `<div class="empty">${T.no_results}</div>`;
  };
  let h; $("#q").addEventListener("input", () => { clearTimeout(h); h = setTimeout(load, 300); });
  $("#cat").addEventListener("change", load);
  await load();
}

// ═══════════ الخدمات ═══════════
async function viewServices(params) {
  shell(`<div class="wrap page-head"><h1>${T.services}</h1><p>${T.services_sub}</p></div>
  <div class="wrap"><div class="toolbar">
    <input id="q" placeholder="${T.search}" value="${esc(params.get("q") || "")}" />
    <select id="cat"><option value="">${T.all_categories}</option>${S.cats.map((c) => `<option value="${c.slug}" ${params.get("category") === c.slug ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
  </div><div class="t-grid" id="list"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div></div>`, "services");
  const load = async () => {
    const q = $("#q").value.trim(), cat = $("#cat").value;
    const r = await api(`/api/services?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`);
    $("#list").innerHTML = (r.data.services || []).map((sv) => `
      <a class="card hover t-card" href="#/service/${sv.id}">
        <div class="t-top">${avatarHtml(sv.name, sv.avatar_url)}
          <div><div class="t-name">${esc(sv.title)}</div><div class="t-sub">${T.by} ${esc(sv.name)} ${sv.verified ? '✓' : ""}</div></div>
        </div>
        <div style="font-size:13px;color:var(--dim);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(sv.description)}</div>
        <div class="chips"><span class="chip brand">${esc(sv.category || "general")}</span><span class="chip">${sv.delivery_days} ${T.d_delivery}</span></div>
        <div class="svc-price"><span class="price">${money(sv.price_min, sv.currency)}${sv.price_max > sv.price_min ? `–${money(sv.price_max, sv.currency)}` : ""}</span><span class="stars">${stars(sv.reputation)}</span></div>
      </a>`).join("") || `<div class="empty">${T.no_results}</div>`;
  };
  let h; $("#q").addEventListener("input", () => { clearTimeout(h); h = setTimeout(load, 300); });
  $("#cat").addEventListener("change", load);
  await load();
}

async function viewService(id) {
  const r = await api(`/api/services/${id}`);
  if (!r.ok) return shell(`<div class="empty"><div class="big">404</div>Service not found.</div>`);
  const sv = r.data.service;
  shell(`<div class="wrap page-head"><a href="#/services" class="tiny muted">← ${T.services}</a>
    <h1 style="margin-top:8px">${esc(sv.title)}</h1></div>
  <div class="wrap grid" style="grid-template-columns:2fr 1fr;align-items:start">
    <div class="panel">
      <p style="white-space:pre-wrap;color:var(--dim);font-size:14.5px">${esc(sv.description)}</p>
      ${sv.requirements ? `<h3 style="margin:22px 0 8px;font-size:15px">${T.requirements}</h3><p class="muted" style="font-size:13.5px;white-space:pre-wrap">${esc(sv.requirements)}</p>` : ""}
    </div>
    <div class="panel">
      <div class="price" style="font-size:26px">${money(sv.price_min, sv.currency)}${sv.price_max > sv.price_min ? ` – ${money(sv.price_max, sv.currency)}` : ""}</div>
      <div class="chips" style="margin:14px 0"><span class="chip">${sv.delivery_days} ${T.days_delivery}</span><span class="chip">${sv.revisions} ${T.revisions}</span></div>
      <a class="btn primary" style="width:100%;justify-content:center" href="#/u/${esc(sv.username)}">${T.view_profile}</a>
    </div>
  </div>`, "services");
}

// ═══════════ صفحة المستقل ═══════════
async function viewProfile(username) {
  const r = await api(`/api/u/${encodeURIComponent(username)}`);
  if (!r.ok) return shell(`<div class="empty"><div class="big">404</div>Profile not found.</div>`);
  const { profile: u, services, works, reviews } = r.data;
  shell(`<div class="wrap page-head">
    <div class="card" style="padding:26px;display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">
      ${avatarHtml(u.name, u.avatar_url, "lg")}
      <div style="flex:1;min-width:220px">
        <div class="t-name" style="font-size:19px">${esc(u.name)} ${u.verified ? '<span class="verified">✓</span>' : ""}</div>
        <div class="t-sub">@${esc(u.username)}${u.country ? " · " + esc(u.country) : ""} · ${T.joined} ${new Date(u.created_at).toLocaleDateString(S.lang === "ar" ? "ar" : "en", { month: "short", year: "numeric" })}</div>
        <div style="margin:10px 0 4px;font-size:14.5px">${esc(u.headline || "")}</div>
        <div class="chips">${jsonChips(u.skills, 8)}</div>
      </div>
      <div style="text-align:right">
        <div class="stars" style="font-size:16px">${stars(u.reputation)} <span class="tiny muted">${u.reputation || 0} (${u.reviews_count || 0})</span></div>
        <div class="tiny muted" style="margin:6px 0 14px">${u.completed || 0} ${T.completed_projects}</div>
        <div class="row">
          ${S.user && S.user.username !== u.username ? `<button class="btn sm" id="follow-btn">${T.follow}</button>` : ""}
          <a class="btn primary sm" href="#/request/new">${T.hire_me}</a>
        </div>
      </div>
    </div>
  </div>
  <div class="wrap grid" style="grid-template-columns:2fr 1fr;align-items:start">
    <div>
      <div class="panel" style="margin-bottom:14px"><h3 style="font-size:15px;margin-bottom:10px">${T.about_h}</h3><p class="muted" style="font-size:13.5px;white-space:pre-wrap">${esc(u.bio || T.no_bio)}</p></div>
      <h3 style="font-size:16px;margin:18px 0 12px">${T.services_h}</h3>
      <div class="t-grid">${services.map((sv) => `<a class="card hover t-card" href="#/service/${sv.id}">
        <b style="font-size:14px">${esc(sv.title)}</b>
        <div style="font-size:12.5px;color:var(--dim);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(sv.description)}</div>
        <div class="svc-price"><span class="price">${money(sv.price_min, sv.currency)}</span><span class="chip">${sv.delivery_days}d</span></div></a>`).join("") || `<div class="empty">${T.no_services}</div>`}</div>
      <h3 style="font-size:16px;margin:26px 0 12px">${T.portfolio_h}</h3>
      <div class="feed">${works.map(workCard).join("") || `<div class="empty">${T.no_works}</div>`}</div>
    </div>
    <div>
      <div class="panel"><h3 style="font-size:15px;margin-bottom:12px">${T.reviews_h}</h3>
        ${reviews.map((rv) => `<div style="padding:10px 0;border-bottom:1px solid var(--line)">
          <div class="row" style="gap:8px">${avatarHtml(rv.author_name, rv.author_avatar)}<span class="tiny"><b>${esc(rv.author_name)}</b> <span class="muted">· ${ago(rv.created_at)}</span></span></div>
          <div class="stars" style="margin:6px 0">${stars(rv.rating)}</div>
          <div style="font-size:13px;color:var(--dim)">${esc(rv.body)}</div></div>`).join("") || `<div class="empty">${T.no_reviews}</div>`}
      </div>
    </div>
  </div>`, "talent");
  $("#follow-btn")?.addEventListener("click", async (e) => {
    const r2 = await api(`/api/users/${encodeURIComponent(username)}/follow`, "POST", {});
    if (r2.ok) e.target.textContent = r2.data.following ? T.following : T.follow;
  });
}

const workCard = (w) => `<div class="card post reveal">
  ${w.media_url ? `<div class="media">${w.media_type === "video" ? videoEmbed(w.media_url, `<span class="play">▶</span>`) : `<img src="${esc(w.thumb_url || w.media_url)}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'">`}</div>` : ""}
  <div class="body"><b style="font-size:14px">${esc(w.title)}</b><div class="tiny muted" style="margin:4px 0 8px">${esc(w.kind)} · ${ago(w.created_at)}</div>
  <div style="font-size:13px;color:var(--dim)">${esc(w.description)}</div></div>
  <div class="post-actions"><button class="like-btn ${w.liked ? "liked" : ""}" data-id="${w.id}">♥ ${w.likes || 0}</button></div>
</div>`;

// روابط فيديو خارجية فقط (لا رفع مباشر — قرار المواصفة)
function videoEmbed(url, fallback = "") {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (yt) return `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" loading="lazy" allowfullscreen title="video"></iframe>`;
  if (vimeo) return `<iframe src="https://player.vimeo.com/video/${vimeo[1]}" loading="lazy" allowfullscreen title="video"></iframe>`;
  return fallback || `<video src="${esc(url)}" controls preload="none" playsinline></video>`;
}

// ═══════════ Discover ═══════════
async function viewDiscover() {
  shell(`<div class="wrap page-head"><h1>${T.discover}</h1><p>${T.discover_sub}</p>
    <div class="toolbar" style="margin-top:14px"><select id="kind"><option value="">${T.all}</option><option value="work">${T.work}</option><option value="achievement">${T.achievement}</option><option value="post">${T.post}</option></select>
    ${S.user ? `<button class="btn primary sm" id="pf-new">${T.share_work}</button>` : `<a class="btn sm" href="#/discover">${T.signin_interact}</a>`}</div></div>
  <div class="wrap"><div class="feed" id="feed"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div></div>`, "discover");
  const load = async () => {
    const kind = $("#kind").value;
    const r = await api(`/api/discover${kind ? `?kind=${kind}` : ""}`);
    $("#feed").innerHTML = (r.data.posts || []).map(workCard).join("") || `<div class="empty">${T.no_results}</div>`;
    $$(".like-btn", $("#feed")).forEach((b) => b.addEventListener("click", async () => {
      if (!S.user) return authModal("login");
      const r2 = await api(`/api/portfolio/${b.dataset.id}/like`, "POST", {});
      if (r2.ok) { b.classList.toggle("liked", r2.data.liked); b.innerHTML = `♥ ${Number(b.textContent.replace(/\D/g, "")) + (r2.data.liked ? 1 : -1)}`; }
    }));
  };
  $("#kind").addEventListener("change", load);
  $("#pf-new")?.addEventListener("click", () => portfolioModal());
  await load();
}

function portfolioModal() {
  const m = $("#modal"); m.hidden = false;
  m.innerHTML = `<div class="modal"><div class="spread" style="margin-bottom:16px"><b>${T.share_your_work}</b><button class="btn ghost sm" onclick="document.getElementById('modal').hidden=true">✕</button></div>
    <div class="field"><label>${T.title}</label><input id="w-title" /></div>
    <div class="field"><label>${T.description}</label><textarea id="w-desc"></textarea></div>
    <div class="form-2">
      <div class="field"><label>${T.type}</label><select id="w-kind"><option value="work">${T.work}</option><option value="achievement">${T.achievement}</option><option value="post">${T.post}</option></select></div>
      <div class="field"><label>${T.media_type}</label><select id="w-mt"><option value="image">${T.image_link}</option><option value="video">${T.video_link}</option></select></div>
    </div>
    <div class="field"><label>${T.media_url}</label><input id="w-url" dir="ltr" placeholder="https://…" /></div>
    <div class="field"><label>${T.thumb_url}</label><input id="w-thumb" dir="ltr" placeholder="https://…" /></div>
    <button class="btn primary" id="w-go" style="width:100%;justify-content:center">${T.publish}</button>
    <div class="msg" id="w-msg" hidden></div></div>`;
  $("#w-go").onclick = async () => {
    const r = await api("/api/portfolio", "POST", {
      title: $("#w-title").value, description: $("#w-desc").value, kind: $("#w-kind").value,
      media_type: $("#w-mt").value, media_url: $("#w-url").value.trim(), thumb_url: $("#w-thumb").value.trim(),
    });
    const msg = $("#w-msg");
    if (!r.ok) { msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(r.data.error); return; }
    m.hidden = true; toast(T.published_t); viewDiscover();
  };
}

// ═══════════ لوحة التحكم ═══════════
async function viewDashboard() {
  if (!S.user) return authModal("register");
  const isFreelancer = S.user.role === "freelancer";
  const aiCard = S.ai ? `<div class="panel" style="margin-bottom:16px"><div class="spread" style="flex-wrap:wrap;gap:10px">
    <div><b style="font-size:14px">${T.ai_credits}</b><div class="tiny muted">${T.plan_l}: <span class="chip brand">${S.plan?.name ?? "FREE"}</span></div></div>
    <div class="row" style="gap:18px">
      <div class="tiny muted">${T.used_today}: <b style="color:var(--fg)">${S.ai.used_daily}/${S.ai.limit_daily}</b></div>
      <div class="tiny muted">${T.quota_monthly}: <b style="color:var(--fg)">${S.ai.used_monthly}/${S.ai.limit_monthly}</b></div>
      <span class="chip">${T.topup_soon}</span>
    </div></div></div>` : "";
  shell(`<div class="wrap page-head"><h1>${T.dashboard}</h1><p>${S.user.role === "admin" ? T.dash_sub_admin : isFreelancer ? T.dash_sub_freelancer : T.dash_sub_client}</p></div>
  <div class="wrap">
    ${aiCard}
    <div class="tabs" id="d-tabs">
      <button data-t="profile" class="on">${T.tab_profile}</button>
      ${isFreelancer ? `<button data-t="services">${T.tab_services}</button><button data-t="open">${T.tab_open}</button><button data-t="proposals">${T.tab_proposals}</button>` : `<button data-t="requests">${T.tab_requests}</button>`}
      <button data-t="portfolio">${T.tab_portfolio}</button><button data-t="projects">${T.tab_projects}</button>
    </div>
    <div id="d-body"><div class="skel"></div></div>
  </div>`, "dashboard");
  const body = $("#d-body");
  const tabs = $$("#d-tabs button");
  tabs.forEach((b) => b.addEventListener("click", () => {
    tabs.forEach((x) => x.classList.remove("on")); b.classList.add("on"); renderTab(b.dataset.t);
  }));
  async function renderTab(tab) {
    body.innerHTML = `<div class="skel"></div>`;
    if (tab === "profile") {
      const me = await api("/api/me");
      const u = me.data.user || {};
      body.innerHTML = `<div class="panel" style="max-width:720px">
        <div class="form-2">
          <div class="field"><label>${T.headline}</label><input id="p-headline" value="${esc(u.headline || "")}" placeholder="Senior Full-stack Developer · React & Node" /></div>
          <div class="field"><label>${T.country}</label><input id="p-country" value="${esc(u.country || "")}" /></div>
        </div>
        <div class="field"><label>${T.bio}</label><textarea id="p-bio" rows="4">${esc(u.bio || "")}</textarea></div>
        <div class="form-2">
          <div class="field"><label>${T.cats_hint}</label><input id="p-cats" dir="ltr" value="${esc((JSON.parse(u.categories || "[]") || []).join(", "))}" placeholder="programming, ai" /></div>
          <div class="field"><label>${T.skills_hint}</label><input id="p-skills" dir="ltr" value="${esc((JSON.parse(u.skills || "[]") || []).join(", "))}" placeholder="react, nodejs, ui-design" /></div>
        </div>
        <div class="form-2">
          <div class="field"><label>${T.avatar_url}</label><input id="p-avatar" dir="ltr" value="${esc(u.avatar_url || "")}" /></div>
          <div class="field"><label>${T.status}</label><select id="p-avail"><option value="1" ${u.available ? "selected" : ""}>${T.avail_work}</option><option value="0" ${!u.available ? "selected" : ""}>${T.busy}</option></select></div>
        </div>
        <button class="btn primary" id="p-save">${T.save}</button><div class="msg" id="p-msg" hidden></div>
      </div>`;
      $("#p-save").onclick = async () => {
        const r = await api("/api/profile", "PUT", {
          headline: $("#p-headline").value, bio: $("#p-bio").value, country: $("#p-country").value,
          avatar_url: $("#p-avatar").value.trim(),
          categories: $("#p-cats").value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
          skills: $("#p-skills").value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
          available: $("#p-avail").value === "1",
        });
        const msg = $("#p-msg"); msg.hidden = false;
        msg.className = `msg ${r.ok ? "ok" : "bad"}`; msg.textContent = r.ok ? T.profile_saved : errText(r.data.error);
        if (r.ok) toast(T.saved_t);
      };
    }
    if (tab === "services") {
      const mine = await api(`/api/services`);
      const mineOwn = (await Promise.all([(api(`/api/u/${S.user.username}`))]))[0];
      const list = (mineOwn.data.services || []);
      body.innerHTML = `<div class="spread" style="margin-bottom:14px"><span class="muted tiny">${list.length} ${T.n_services}</span><button class="btn primary sm" id="sv-new">${T.new_service}</button></div>
        <div class="t-grid">${list.map((sv) => `<div class="card t-card"><b style="font-size:14px">${esc(sv.title)}</b>
          <div style="font-size:12.5px;color:var(--dim);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(sv.description)}</div>
          <div class="svc-price"><span class="price">${money(sv.price_min, sv.currency)}</span><span class="chip">${sv.delivery_days}d</span></div></div>`).join("") || `<div class="empty">${T.no_services_yet}</div>`}</div>`;
      $("#sv-new").addEventListener("click", serviceModal);
    }
    if (tab === "portfolio") {
      const mine = await api(`/api/u/${S.user.username}`);
      body.innerHTML = `<div class="spread" style="margin-bottom:14px"><span></span><button class="btn primary sm" id="pf-new2">${T.share_work}</button></div>
        <div class="feed">${(mine.data.works || []).map(workCard).join("") || `<div class="empty">${T.nothing_shared}</div>`}</div>`;
      $("#pf-new2").addEventListener("click", portfolioModal);
      bindLikes(body, renderTab, tab);
    }
    if (tab === "requests") {
      const r = await api("/api/requests");
      body.innerHTML = `<div class="spread" style="margin-bottom:14px"><span class="muted tiny">${(r.data.requests || []).length} ${T.n_requests}</span><a class="btn primary sm" href="#/request/new">${T.new_request}</a></div>
        ${(r.data.requests || []).map((rq) => `<a class="card hover card-pad" href="#/request/${rq.id}" style="display:block;margin-bottom:10px">
          <div class="spread"><b style="font-size:14.5px">${esc(rq.title)}</b><span class="chip ${rq.status === "open" ? "ok" : ""}">${rq.status}</span></div>
          <div class="tiny muted" style="margin-top:6px">${rq.proposals_count} ${T.proposals_c} · ${T.budget} ${rq.budget_min ? money(rq.budget_min, rq.currency) + (rq.budget_max > rq.budget_min ? "–" + money(rq.budget_max, rq.currency) : "") : "—"} · ${ago(rq.created_at)}</div></a>`).join("") || `<div class="empty">${T.no_requests}</div>`}`;
    }
    if (tab === "open") {
      const r = await api("/api/requests/open");
      body.innerHTML = `<p class="tiny muted" style="margin-bottom:14px">${T.open_ranked}</p>
        ${(r.data.requests || []).map((rq) => `<div class="card card-pad" style="margin-bottom:10px">
          <div class="spread"><a href="#/request/${rq.id}" style="flex:1"><b style="font-size:14.5px">${esc(rq.title)}</b>
          <div class="tiny muted" style="margin-top:4px">${esc(rq.category || "general")} · ${T.budget} ${rq.budget_min ? money(rq.budget_min, rq.currency) : T.open} · ${rq.proposals_count} ${T.proposals_c}</div></a>
          <button class="btn primary sm" data-propose="${rq.id}">${T.propose}</button></div></div>`).join("") || `<div class="empty">${T.no_open}</div>`}`;
      $$("[data-propose]", body).forEach((b) => b.addEventListener("click", () => proposalModal(b.dataset.propose)));
    }
    if (tab === "proposals") {
      body.innerHTML = `<div class="empty">${T.proposals_hint}</div>`;
    }
    if (tab === "projects") {
      const r = await api("/api/projects");
      body.innerHTML = (r.data.projects || []).map((p) => `<a class="card hover card-pad" href="#/project/${p.id}" style="display:block;margin-bottom:10px">
        <div class="spread"><b style="font-size:14.5px">${esc(p.title)}</b><span class="chip ${p.status === "completed" ? "ok" : p.status === "active" ? "" : "warn"}">${p.status}${p.client_confirmed && p.freelancer_confirmed ? " ✓" : ""}</span></div>
        <div class="tiny muted" style="margin-top:6px">${money(p.amount)} · ${T.with} ${esc(p.client_id === S.user.id ? p.freelancer_name : p.client_name)} · ${ago(p.created_at)}</div></a>`).join("") || `<div class="empty">${T.no_projects}</div>`;
    }
  }
  await renderTab("profile");
}

function bindLikes(root, rerender, arg) {
  $$(".like-btn", root).forEach((b) => b.addEventListener("click", async () => {
    const r = await api(`/api/portfolio/${b.dataset.id}/like`, "POST", {});
    if (r.ok) rerender(arg);
  }));
}

function serviceModal() {
  const m = $("#modal"); m.hidden = false;
  m.innerHTML = `<div class="modal" style="max-width:520px"><div class="spread" style="margin-bottom:16px"><b>${T.new_service_t}</b><button class="btn ghost sm" onclick="document.getElementById('modal').hidden=true">✕</button></div>
    <div class="field"><label>${T.title}</label><input id="sv-title" placeholder="I will build a responsive landing page" /></div>
    <div class="field"><label>${T.description}</label><textarea id="sv-desc" placeholder="What's included, your process, what the buyer receives…"></textarea></div>
    <div class="form-2">
      <div class="field"><label>${T.category}</label><select id="sv-cat">${S.cats.map((c) => `<option value="${c.slug}">${esc(c.name)}</option>`).join("")}</select></div>
      <div class="field"><label>${T.currency}</label><select id="sv-cur"><option selected>DZD</option></select></div>
    </div>
    <div class="form-2">
      <div class="field"><label>${T.price_from}</label><input id="sv-min" type="number" min="0" /></div>
      <div class="field"><label>${T.price_to}</label><input id="sv-max" type="number" min="0" /></div>
    </div>
    <div class="form-2">
      <div class="field"><label>${T.delivery_days}</label><input id="sv-days" type="number" value="7" min="1" /></div>
      <div class="field"><label>${T.revisions_n}</label><input id="sv-rev" type="number" value="1" min="0" /></div>
    </div>
    <div class="field"><label>${T.skills_csv}</label><input id="sv-skills" dir="ltr" placeholder="react, landing-page" /></div>
    <div class="field"><label>${T.req_buyer}</label><input id="sv-req" /></div>
    <button class="btn primary" id="sv-go" style="width:100%;justify-content:center">${T.publish_service}</button>
    <div class="msg" id="sv-msg" hidden></div></div>`;
  $("#sv-go").onclick = async () => {
    const r = await api("/api/services", "POST", {
      title: $("#sv-title").value, description: $("#sv-desc").value, category: $("#sv-cat").value,
      currency: $("#sv-cur").value, price_min: Number($("#sv-min").value) || 0, price_max: Number($("#sv-max").value) || 0,
      delivery_days: Number($("#sv-days").value) || 7, revisions: Number($("#sv-rev").value) || 0,
      skills: $("#sv-skills").value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
      requirements: $("#sv-req").value,
    });
    const msg = $("#sv-msg");
    if (!r.ok) { msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(r.data.error); return; }
    m.hidden = true; toast(T.service_published); route();
  };
}

// ═══════════ طلب جديد (هيكلة ذكية + يدوي) ═══════════
async function viewRequestNew() {
  if (!S.user) return authModal("register");
  shell(`<div class="wrap page-head"><h1>${T.post_project}</h1><p>${T.post_sub}</p></div>
  <div class="wrap" style="max-width:760px">
    <div class="panel" style="margin-bottom:14px">
      <div class="field"><label>${T.describe}</label><textarea id="r-raw" rows="5" placeholder="I need a landing page for my SaaS with pricing section and contact form. Budget around $300, need it in 2 weeks…"></textarea></div>
      <button class="btn primary" id="r-analyze">${T.ai_structure}</button>
      <div class="msg info" id="r-ai-msg" hidden></div>
    </div>
    <div class="panel">
      <div class="field"><label>${T.title}</label><input id="r-title" /></div>
      <div class="field"><label>${T.full_description}</label><textarea id="r-desc" rows="5"></textarea></div>
      <div class="form-2">
        <div class="field"><label>${T.category}</label><select id="r-cat"><option value="">—</option>${S.cats.map((c) => `<option value="${c.slug}">${esc(c.name)}</option>`).join("")}</select></div>
        <div class="field"><label>${T.currency}</label><select id="r-cur"><option selected>DZD</option></select></div>
      </div>
      <div class="form-2">
        <div class="field"><label>${T.budget_from}</label><input id="r-min" type="number" min="0" /></div>
        <div class="field"><label>${T.budget_to}</label><input id="r-max" type="number" min="0" /></div>
      </div>
      <div class="field"><label>${T.skills_needed}</label><input id="r-skills" dir="ltr" placeholder="react, seo" /></div>
      <button class="btn primary" id="r-go" style="width:100%;justify-content:center">${T.publish_request}</button>
      <div class="msg" id="r-msg" hidden></div>
    </div>
  </div>`, "dashboard");
  $("#r-analyze").addEventListener("click", async () => {
    const btn = $("#r-analyze"), msg = $("#r-ai-msg");
    const text = $("#r-raw").value.trim();
    if (text.length < 15) { msg.hidden = false; msg.className = "msg info"; msg.textContent = T.write_first; return; }
    btn.disabled = true; btn.textContent = T.analyzing; msg.hidden = true;
    const r = await api("/api/requests/structure", "POST", { text });
    btn.disabled = false; btn.textContent = T.ai_structure;
    if (!r.ok) {
      msg.hidden = false; msg.className = "msg info";
      msg.textContent = T.ai_down;
      return;
    }
    const d = r.data.data;
    $("#r-title").value = d.title; $("#r-desc").value = text; $("#r-cat").value = d.category || "";
    $("#r-min").value = d.budget_min || ""; $("#r-max").value = d.budget_max || "";
    $("#r-skills").value = (d.skills || []).join(", ");
    msg.hidden = false; msg.className = "msg ok";
    msg.textContent = `${T.structured_via} Vito AI Hub.` + ((d.questions || []).length ? ` ${T.clarify} ${d.questions.join(" ")}` : ` ${T.review_publish}`);
  });
  $("#r-go").addEventListener("click", async () => {
    const r = await api("/api/requests", "POST", {
      title: $("#r-title").value, description: $("#r-desc").value, category: $("#r-cat").value,
      currency: $("#r-cur").value, budget_min: Number($("#r-min").value) || 0, budget_max: Number($("#r-max").value) || 0,
      skills: $("#r-skills").value.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
      structured: $("#r-raw").value.trim() ? "1" : "",
    });
    const msg = $("#r-msg");
    if (!r.ok) { msg.hidden = false; msg.className = "msg bad"; msg.textContent = errText(r.data.error); return; }
    toast(T.request_published); location.hash = `#/request/${r.data.id}`;
  });
}

// ═══════════ تفاصيل الطلب ═══════════
async function viewRequest(id) {
  if (!S.user) return authModal("register");
  const mine = await api("/api/requests");
  const rq = (mine.data.requests || []).find((x) => x.id === id);
  const isOwner = !!rq;
  shell(`<div class="wrap page-head"><a href="#/dashboard" class="tiny muted">← ${T.dashboard}</a>
    <h1 style="margin-top:8px">${esc(rq ? rq.title : T.project_request)}</h1>
    ${rq ? `<p>${esc(rq.description)}</p><div class="chips" style="margin-top:10px"><span class="chip brand">${esc(rq.category || "general")}</span><span class="chip">${rq.status}</span>${rq.budget_min ? `<span class="chip ok">${T.budget} ${money(rq.budget_min, rq.currency)}${rq.budget_max > rq.budget_min ? "–" + money(rq.budget_max, rq.currency) : ""}</span>` : ""}</div>` : ""}
  </div>
  <div class="wrap"><div id="req-body"><div class="skel"></div></div></div>`, "dashboard");
  const body = $("#req-body");
  if (isOwner) {
    const [m, pr] = await Promise.all([api(`/api/requests/${id}/matches`), api(`/api/requests/${id}/proposals`)]);
    const propCards = (await Promise.all((pr.data.proposals || []).map(async (pp) => `<div class="card card-pad" style="margin-bottom:10px">
        <div class="t-top">${avatarHtml(pp.name, pp.avatar_url)}
          <div style="flex:1"><a class="t-name" href="#/u/${esc(pp.username)}">${esc(pp.name)}</a>
          <div class="t-sub">${stars(pp.reputation)} ${pp.completed || 0} projects ${pp.verified ? "· ✓" : ""}</div></div>
          <div style="text-align:right"><div class="price">${money(pp.amount)}</div><div class="tiny muted">${pp.days} days</div></div>
        </div>
        <p style="font-size:13.5px;color:var(--dim);margin:10px 0;white-space:pre-wrap">${esc(pp.cover)}</p>
        <div class="spread">${pp.status !== "pending" ? `<span class="chip ${pp.status === "accepted" ? "ok" : ""}">${pp.status}</span>` : `<span></span>`}
        ${pp.status === "pending" ? `<button class="btn primary sm" data-accept="${pp.id}">${T.accept_open}</button>` : pp.status === "accepted" ? `<a class="btn sm" href="#/project/${await projectIdFor(pp.id)}">${T.open_room}</a>` : ""}</div>
      </div>`))).join("") || `<div class="empty">${T.no_proposals}</div>`;
    body.innerHTML = `
      <h3 style="font-size:15px;margin-bottom:10px">${T.top_matches} <span class="tiny muted">${T.weighted_by}</span></h3>
      <div class="t-grid" style="margin-bottom:26px">${(m.data.matches || []).filter((x) => x.score > 0).slice(0, 6).map((u) => talentCard(u)).join("") || `<div class="empty">${T.no_matches}</div>`}</div>
      <h3 style="font-size:15px;margin-bottom:10px">${T.proposals} <span class="tiny muted">(${(pr.data.proposals || []).length})</span></h3>
      ${propCards}
      ${rq.status === "open" ? `<button class="btn danger sm" id="rq-close" style="margin-top:8px">${T.close_request}</button>` : ""}`;
    $$("[data-accept]", body).forEach((b) => b.addEventListener("click", async () => {
      const r = await api(`/api/proposals/${b.dataset.accept}/accept`, "POST", {});
      if (r.ok) { toast(T.project_created); location.hash = `#/project/${r.data.project_id}`; }
      else toast(errText(r.data.error));
    }));
    $("#rq-close")?.addEventListener("click", async () => { await api(`/api/requests/${id}/close`, "POST", {}); route(); });
  } else {
    const pr = await api(`/api/requests/${id}/proposals`);
    body.innerHTML = S.user.role === "freelancer" || S.user.role === "admin" ? `
      ${(pr.data.proposals || []).length ? `<div class="panel">${T.your_proposal_is} <span class="chip ${pr.data.proposals[0].status === "accepted" ? "ok" : ""}">${pr.data.proposals[0].status}</span></div>` : `
      <button class="btn primary" id="pp-new">${T.send_proposal}</button>`}</div>` : `<div class="empty">${T.owner_only}</div>`;
    $("#pp-new")?.addEventListener("click", () => proposalModal(id));
  }
  async function projectIdFor(pid) {
    const r = await api("/api/projects");
    const p = (r.data.projects || []).find((x) => x.proposal_id === pid);
    return p ? p.id : "";
  }
}

function proposalModal(requestId) {
  const m = $("#modal"); m.hidden = false;
  m.innerHTML = `<div class="modal"><div class="spread" style="margin-bottom:16px"><b>${T.your_proposal}</b><button class="btn ghost sm" onclick="document.getElementById('modal').hidden=true">✕</button></div>
    <div class="form-2">
      <div class="field"><label>${T.amount}</label><input id="pp-amt" type="number" min="1" /></div>
      <div class="field"><label>${T.delivery_days}</label><input id="pp-days" type="number" value="7" min="1" /></div>
    </div>
    <div class="field"><label>${T.cover_letter}</label><textarea id="pp-cover" rows="5" placeholder="${T.cover_hint}"></textarea></div>
    <button class="btn primary" id="pp-go" style="width:100%;justify-content:center">${T.send_proposal_go}</button>
    <div class="msg" id="pp-msg" hidden></div></div>`;
  $("#pp-go").onclick = async () => {
    const r = await api("/api/proposals", "POST", { request_id: requestId, amount: Number($("#pp-amt").value) || 0, days: Number($("#pp-days").value) || 7, cover: $("#pp-cover").value });
    const msg = $("#pp-msg");
    if (!r.ok) { msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(r.data.error); return; }
    m.hidden = true; toast(T.proposal_sent); route();
  };
}

// ═══════════ غرفة المشروع ═══════════
async function viewProject(id) {
  if (!S.user) return authModal("register");
  const r = await api(`/api/projects/${id}`);
  if (!r.ok) return shell(`<div class="empty">${T.owner_only}</div>`);
  const { project: p, messages, milestones, deliverables, reviewed } = r.data;
  const iAmClient = p.client_id === S.user.id;
  const other = iAmClient ? p.freelancer_name : p.client_name;
  const iReviewed = (reviewed || []).includes(S.user.id);
  const bothConfirmed = p.client_confirmed && p.freelancer_confirmed;
  shell(`<div class="wrap page-head"><a href="#/dashboard" class="tiny muted">${T.projects_back}</a>
    <div class="spread" style="margin-top:8px;flex-wrap:wrap;gap:10px">
      <div><h1>${esc(p.title)}</h1><p>${money(p.amount)} · ${T.with} ${esc(other)} · <span class="chip ${p.status === "completed" ? "ok" : "warn"}">${p.status}</span></p></div>
      <div class="row">
        ${p.status !== "completed" ? `<button class="btn ${iAmClient ? "" : "primary"} sm" id="pj-confirm">${p[iAmClient ? "client_confirmed" : "freelancer_confirmed"] ? T.confirmed_waiting : T.confirm_completion}</button>` : `<span class="chip ok">${T.completed}</span>`}
        ${p.status === "completed" && !iReviewed ? `<button class="btn primary sm" id="pj-review">${T.leave_review}</button>` : ""}
      </div>
    </div></div>
  <div class="wrap grid" style="grid-template-columns:1.6fr 1fr;align-items:start">
    <div>
      <div class="panel" style="margin-bottom:14px"><h3 style="font-size:14px;margin-bottom:12px">${T.messages_h}</h3>
        <div class="chat" id="chat">${messages.map((m) => `<div class="bubble ${m.sender_id === S.user.id ? "mine" : ""}"><div class="who">${esc(m.sender_name)} · ${ago(m.created_at)}</div>${esc(m.body)}</div>`).join("") || `<div class="empty tiny">${T.start_convo}</div>`}</div>
        ${p.status !== "completed" ? `<div class="row" style="margin-top:12px"><input id="msg-in" placeholder="${T.write_msg}" /><button class="btn primary" id="msg-go">${T.send}</button></div>` : ""}
      </div>
      <div class="panel"><h3 style="font-size:14px;margin-bottom:12px">${T.deliverables_h}</h3>
        ${deliverables.map((d) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><a class="tiny" style="color:var(--brand2);word-break:break-all" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.url)}</a><div class="tiny muted">${esc(d.note)} · ${esc(d.added_by_name)} · ${ago(d.created_at)}</div></div>`).join("") || `<div class="tiny muted">${T.no_deliverables}</div>`}
        <div class="row" style="margin-top:12px"><input id="dv-url" dir="ltr" placeholder="https://link-to-delivery…" /><button class="btn sm" id="dv-go">${T.attach}</button></div>
      </div>
    </div>
    <div>
      <div class="panel" style="margin-bottom:14px"><div class="spread"><h3 style="font-size:14px">${T.milestones_h}</h3>${p.status !== "completed" ? `<button class="btn ghost sm" id="ms-new">${T.add}</button>` : ""}</div>
        ${milestones.map((ms) => `<div class="spread" style="padding:9px 0;border-bottom:1px solid var(--line)">
          <span style="font-size:13px">${esc(ms.title)}</span>
          <span class="chip ${ms.status === "approved" ? "ok" : ms.status === "delivered" ? "warn" : ""}">${ms.status}</span>
          <span class="row">${!iAmClient && ms.status === "pending" ? `<button class="btn ghost sm" data-ms="${ms.id}" data-st="delivered">${T.deliver}</button>` : ""}
          ${iAmClient && ms.status === "delivered" ? `<button class="btn ghost sm" data-ms="${ms.id}" data-st="approved">${T.approve}</button>` : ""}</span></div>`).join("") || `<div class="tiny muted">${T.break_work}</div>`}
      </div>
      <div class="panel"><h3 style="font-size:14px;margin-bottom:10px">${T.trust_flow}</h3>
        <div class="tiny muted" style="line-height:2">
        ${iAmClient ? "✓" : p.client_confirmed ? "✓" : "◦"} ${T.client_confirm}<br>
        ${!iAmClient ? "✓" : p.freelancer_confirmed ? "✓" : "◦"} ${T.freelancer_confirm}<br>
        ${bothConfirmed ? `<span style="color:var(--ok)">${T.completed_unlocked}</span>` : `<span>${T.needs_both}</span>`}
        </div></div>
    </div>
  </div>`, "dashboard");
  const scrollChat = () => { const c = $("#chat"); if (c) c.scrollTop = c.scrollHeight; };
  scrollChat();
  $("#msg-go")?.addEventListener("click", sendMsg);
  $("#msg-in")?.addEventListener("keydown", (e) => e.key === "Enter" && sendMsg());
  async function sendMsg() {
    const inp = $("#msg-in"); const v = inp.value.trim(); if (!v) return;
    inp.value = "";
    await api(`/api/projects/${id}/messages`, "POST", { body: v });
    viewProject(id);
  }
  $("#dv-go")?.addEventListener("click", async () => {
    const url = $("#dv-url").value.trim();
    const r2 = await api(`/api/projects/${id}/deliverables`, "POST", { url });
    if (r2.ok) viewProject(id); else toast(errText(r2.data.error));
  });
  $("#ms-new")?.addEventListener("click", () => {
    const title = prompt(T.milestones_h + ":"); if (!title) return;
    api(`/api/projects/${id}/milestones`, "POST", { title }).then(() => viewProject(id));
  });
  $$("[data-ms]").forEach((b) => b.addEventListener("click", async () => {
    await api(`/api/milestones/${b.dataset.ms}/status`, "POST", { status: b.dataset.st });
    viewProject(id);
  }));
  $("#pj-confirm")?.addEventListener("click", async () => {
    const r2 = await api(`/api/projects/${id}/confirm`, "POST", {});
    if (r2.ok) { toast(bothConfirmed ? T.completed_t : T.confirmed_t); viewProject(id); }
  });
  $("#pj-review")?.addEventListener("click", () => {
    const m = $("#modal"); m.hidden = false;
    m.innerHTML = `<div class="modal"><div class="spread" style="margin-bottom:16px"><b>${T.review_sb} ${esc(other)}</b><button class="btn ghost sm" onclick="document.getElementById('modal').hidden=true">✕</button></div>
      <div class="field"><label>${T.rating}</label><div class="rate-input" id="rate">${[1,2,3,4,5].map((i) => `<span data-r="${i}">★</span>`).join("")}</div></div>
      <div class="field"><label>${T.your_review}</label><textarea id="rv-body" rows="4" placeholder="${T.review_hint}"></textarea></div>
      <button class="btn primary" id="rv-go" style="width:100%;justify-content:center">${T.publish_review}</button>
      <div class="msg" id="rv-msg" hidden></div></div>`;
    let rating = 5;
    const paint = () => $$("#rate span").forEach((sp) => sp.classList.toggle("on", Number(sp.dataset.r) <= rating));
    paint();
    $$("#rate span").forEach((sp) => sp.addEventListener("click", () => { rating = Number(sp.dataset.r); paint(); }));
    $("#rv-go").onclick = async () => {
      const r2 = await api("/api/reviews", "POST", { project_id: id, rating, body: $("#rv-body").value });
      const msg = $("#rv-msg");
      if (!r2.ok) { msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(r2.data.error); return; }
      m.hidden = true; toast(T.review_published); viewProject(id);
    };
  });
}

// ═══════════ ADS ═══════════
async function viewAds() {
  const r = await api("/api/ads/approved");
  shell(`<div class="wrap page-head"><h1>${T.ads_h}</h1><p>${T.ads_sub}</p></div>
  <div class="wrap" style="max-width:760px">
    ${S.user ? `<div class="panel" style="margin-bottom:16px"><h3 style="font-size:15px;margin-bottom:12px">${T.submit_campaign}</h3>
      <div class="field"><label>${T.title}</label><input id="ad-title" /></div>
      <div class="field"><label>${T.body}</label><input id="ad-body" /></div>
      <div class="field"><label>${T.target_link}</label><input id="ad-url" dir="ltr" /></div>
      <div class="field"><label>${T.media_link}</label><input id="ad-media" dir="ltr" /></div>
      <button class="btn primary" id="ad-go">${T.submit_review_go}</button><div class="msg" id="ad-msg" hidden></div></div>` : `<div class="msg info" style="margin-bottom:16px">${T.signin_submit}</div>`}
    <h3 style="font-size:15px;margin:10px 0 12px">${T.live_sponsored}</h3>
    ${(r.data.ads || []).map((a) => `<div class="ad-slot" style="margin-bottom:10px"><span class="ad-tag">${T.sponsored}</span>
      <div style="flex:1"><b style="font-size:14px">${esc(a.title)}</b><div class="tiny muted">${esc(a.body)}</div></div>
      <a class="btn sm" href="${esc(a.target_url)}" target="_blank" rel="noopener noreferrer nofollow" onclick="fetch('/api/ads/${a.id}/click',{method:'POST'})">${T.visit}</a></div>`).join("") || `<div class="empty">${T.no_campaigns}</div>`}
  </div>`);
  $("#ad-go")?.addEventListener("click", async () => {
    const r2 = await api("/api/ads", "POST", { title: $("#ad-title").value, body: $("#ad-body").value, target_url: $("#ad-url").value.trim(), media_url: $("#ad-media").value.trim() });
    const msg = $("#ad-msg");
    if (!r2.ok) { msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(r2.data.error); return; }
    msg.className = "msg ok"; msg.hidden = false; msg.textContent = T.submitted_pending;
  });
}

// ═══════════ About ═══════════
function viewAbout() {
  shell(`<div class="wrap page-head"><h1>${T.about_h1}</h1></div>
  <div class="wrap grid" style="max-width:800px">
    <div class="panel"><h3 style="margin-bottom:10px">${T.about_product_h}</h3><p class="muted" style="font-size:14px;line-height:1.9">${T.about_product_p}</p></div>
    <div class="panel"><h3 style="margin-bottom:10px">${T.about_trust_h}</h3><p class="muted" style="font-size:14px;line-height:1.9">${T.about_trust_p}</p></div>
    <div class="panel"><h3 style="margin-bottom:10px">${T.about_tech_h}</h3><p class="muted" style="font-size:14px;line-height:1.9">${T.about_tech_p}</p></div>
    <div class="panel center"><div class="studio" style="margin:0 auto"><span class="s-mark">V</span><span class="s-name">${T.designed_by}<b>VITO BYTE STUDIO</b></span></div></div>
  </div>`, "");
}

// ═══════════ Admin ═══════════
async function viewAdmin() {
  // بلا رابط اللوحة: 404 صامت — لا معلومة للمتطفل
  if (!S.panel) return shell(`<div class="empty"><div class="big">404</div>Not found.</div>`);
  if (!S.user || S.user.role !== "admin") return shell(`<div class="empty"><div class="big">404</div>Not found.</div>`);
  const st = await api("/api/admin/stats");
  if (!st.ok) return shell(`<div class="empty"><div class="big">404</div>Not found.</div>`);
  try { localStorage.setItem("nk_panel", "/panel/" + S.panel); } catch {}
  const d = st.data;
  shell(`<div class="wrap page-head"><h1>${T.admin}</h1><p>${T.admin_sub} · <span class="tiny" style="color:var(--ok)">${T.admin_security_note}</span></p></div>
  <div class="wrap">
    <div class="stat-grid" style="margin-bottom:20px">
      <div class="card stat-card"><b>${d.users ?? "—"}</b><span>${T.users}</span></div>
      <div class="card stat-card"><b>${d.freelancers ?? "—"}</b><span>${T.freelancers}</span></div>
      <div class="card stat-card"><b>${d.services ?? "—"}</b><span>${T.services}</span></div>
      <div class="card stat-card"><b>${d.requests ?? "—"}</b><span>${T.requests}</span></div>
      <div class="card stat-card"><b>${d.projects ?? "—"}</b><span>${T.projects}</span></div>
      <div class="card stat-card"><b>${d.completed ?? "—"}</b><span>${T.completed}</span></div>
      <div class="card stat-card"><b>${d.flagged_reviews ?? "—"}</b><span>${T.flagged}</span></div>
    </div>
    <div class="tabs">
      <button class="on" data-t="reviews">${T.tab_flagged}</button><button data-t="ads">${T.tab_campaigns}</button>
      <button data-t="users">${T.tab_users}</button><button data-t="audit">${T.tab_audit}</button>
      <button data-t="settings">${T.admin_settings}</button><button data-t="payments">${T.payments_tab}</button>
      <button data-t="devices">${T.devices_tab}</button><button data-t="finaudit">${T.fin_audit}</button>
    </div>
    <div id="a-body"><div class="skel"></div></div>
  </div>`, "admin");
  const body = $("#a-body");
  $$(".tabs button").forEach((b2) => b2.addEventListener("click", async () => {
    $$(".tabs button").forEach((x) => x.classList.remove("on")); b2.classList.add("on"); render(b2.dataset.t);
  }));
  async function render(t) {
    body.innerHTML = `<div class="skel"></div>`;
    if (t === "reviews") {
      const r = await api("/api/admin/reviews/flagged");
      body.innerHTML = (r.data.reviews || []).map((rv) => `<div class="card card-pad" style="margin-bottom:10px"><div class="spread">
        <span><b class="tiny">@${esc(rv.author_username)}</b> → <span class="tiny">@${esc(rv.target_username)}</span> <span class="stars">${stars(rv.rating)}</span></span>
        <span class="row"><button class="btn sm" data-rv="${rv.id}" data-s="published">${T.keep}</button><button class="btn danger sm" data-rv="${rv.id}" data-s="hidden">${T.hide}</button></span></div>
        <p class="tiny muted" style="margin-top:6px">${esc(rv.body)}</p></div>`).join("") || `<div class="empty">${T.no_flagged}</div>`;
      $$("[data-rv]", body).forEach((b2) => b2.addEventListener("click", async () => { await api(`/api/admin/reviews/${b2.dataset.rv}/moderate`, "POST", { status: b2.dataset.s }); render("reviews"); }));
    }
    if (t === "ads") {
      const r = await api("/api/admin/ads");
      body.innerHTML = (r.data.ads || []).map((a2) => `<div class="card card-pad" style="margin-bottom:10px"><div class="spread">
        <span><b class="tiny">@${esc(a2.advertiser_username)}</b> — ${esc(a2.title)} <span class="chip ${a2.status === "approved" ? "ok" : a2.status === "rejected" ? "bad" : "warn"}">${a2.status}</span></span>
        <span class="row">${a2.status !== "approved" ? `<button class="btn sm" data-ad="${a2.id}" data-s="approved">${T.approve}</button>` : ""}
        ${a2.status !== "rejected" ? `<button class="btn danger sm" data-ad="${a2.id}" data-s="rejected">${T.reject}</button>` : ""}</span></div></div>`).join("") || `<div class="empty">${T.no_campaigns2}</div>`;
      $$("[data-ad]", body).forEach((b2) => b2.addEventListener("click", async () => { await api(`/api/admin/ads/${b2.dataset.ad}/moderate`, "POST", { status: b2.dataset.s }); render("ads"); }));
    }
    if (t === "users") {
      const r = await api("/api/admin/users");
      body.innerHTML = `<div class="card" style="overflow-x:auto"><table style="width:100%;font-size:13px;border-collapse:collapse">
        ${(r.data.users || []).map((u) => `<tr style="border-bottom:1px solid var(--line)">
          <td style="padding:10px">@${esc(u.username)}</td><td class="muted">${esc(u.email)}</td><td><span class="chip">${u.role}</span></td>
          <td><button class="btn ghost sm" data-uv="${u.id}" data-v="${u.verified ? 0 : 1}">${u.verified ? T.verified : T.verify}</button></td>
          <td><button class="btn ghost sm ${u.banned ? "danger" : ""}" data-ub="${u.id}" data-b="${u.banned ? 0 : 1}">${u.banned ? T.unban : T.ban}</button></td></tr>`).join("")}</table></div>`;
      $$("[data-uv]", body).forEach((b2) => b2.addEventListener("click", async () => { await api(`/api/admin/users/${b2.dataset.uv}/flags`, "POST", { verified: b2.dataset.v === "1" }); render("users"); }));
      $$("[data-ub]", body).forEach((b2) => b2.addEventListener("click", async () => { await api(`/api/admin/users/${b2.dataset.ub}/flags`, "POST", { banned: b2.dataset.b === "1" }); render("users"); }));
    }
    if (t === "audit") {
      const r = await api("/api/admin/audit");
      body.innerHTML = (r.data.audit || []).map((a2) => `<div class="tiny muted" style="padding:6px 0;border-bottom:1px solid var(--line)">${new Date(a2.created_at).toLocaleString(S.lang === "ar" ? "ar" : "en")} — <b style="color:var(--fg)">${esc(a2.action)}</b> ${esc(a2.detail)}</div>`).join("") || `<div class="empty">${T.no_audit}</div>`;
    }
    if (t === "settings") {
      const r = await api("/api/admin/settings");
      const g = (k) => esc((r.data.settings || []).find((x) => x.k === k)?.v ?? "");
      body.innerHTML = `<div class="panel" style="max-width:680px">
        <div class="field"><label>${T.payments_enabled_l}</label><select id="st-pay"><option value="0" ${g("payments_enabled") !== "1" ? "selected" : ""}>OFF — ${T.coming_soon}</option><option value="1" ${g("payments_enabled") === "1" ? "selected" : ""}>ON</option></select></div>
        <div class="form-2">
          <div class="field"><label>${T.ai_daily_l}</label><input id="st-ad" type="number" min="1" value="${g("ai_free_daily") || "10"}" /></div>
          <div class="field"><label>${T.ai_monthly_l}</label><input id="st-am" type="number" min="1" value="${g("ai_free_monthly") || "100"}" /></div>
        </div>
        <div class="field"><label>${T.credits_price_l}</label><input id="st-cp" type="number" min="100" value="${g("credits_price_dzd_per_100") || "300"}" /></div>
        <div class="form-2">
          <div class="field"><label>${T.webhook_secret_l} — Chargily</label><input id="st-wc" dir="ltr" value="${g("webhook_secret_chargily")}" /></div>
          <div class="field"><label>${T.webhook_secret_l} — SofizPay</label><input id="st-ws" dir="ltr" value="${g("webhook_secret_sofizpay")}" /></div>
        </div>
        <div class="spread"><button class="btn primary" id="st-save">${T.save_settings}</button><button class="btn danger sm" id="st-rot">${T.rotate_panel}</button></div>
        <div class="msg" id="st-msg" hidden></div></div>`;
      $("#st-save").onclick = async () => {
        const r2 = await api("/api/admin/settings", "PUT", {
          payments_enabled: $("#st-pay").value, ai_free_daily: $("#st-ad").value, ai_free_monthly: $("#st-am").value,
          credits_price_dzd_per_100: $("#st-cp").value, webhook_secret_chargily: $("#st-wc").value.trim(), webhook_secret_sofizpay: $("#st-ws").value.trim(),
        });
        const m = $("#st-msg"); m.hidden = false; m.className = `msg ${r2.ok ? "ok" : "bad"}`; m.textContent = r2.ok ? T.settings_saved : errText(r2.data.error);
      };
      $("#st-rot").onclick = async () => {
        const r2 = await api("/api/admin/rotate-panel", "POST", {});
        if (r2.ok) showPanelLink(r2.data.panel_url, true);
      };
    }
    if (t === "payments") {
      const r = await api("/api/admin/payments");
      body.innerHTML = (r.data.payments || []).map((pm) => `<div class="card card-pad" style="margin-bottom:10px"><div class="spread">
        <span class="tiny"><b>${esc(pm.reference)}</b> — ${esc(pm.name)} · ${money(pm.amount_dzd)} · ${esc(pm.kind)} <span class="chip ${pm.status === "confirmed" ? "ok" : pm.status === "pending" ? "warn" : ""}">${pm.status}</span> ${(pm.risk_flags || "[]") !== "[]" ? `<span class="chip bad">${esc(String(pm.risk_flags))}</span>` : ""}</span>
        <span class="row">${pm.status === "pending" ? `<button class="btn sm" data-pm="${pm.id}" data-s="confirmed">${T.approve}</button><button class="btn danger sm" data-pm="${pm.id}" data-s="rejected">${T.reject}</button>` : ""}
        ${pm.status === "confirmed" ? `<button class="btn ghost sm" data-pm="${pm.id}" data-s="refunded">Refund</button>` : ""}</span></div></div>`).join("") || `<div class="empty">${T.no_payments}</div>`;
      $$("[data-pm]", body).forEach((b2) => b2.addEventListener("click", async () => { await api(`/api/admin/payments/${b2.dataset.pm}/status`, "POST", { status: b2.dataset.s }); render("payments"); }));
    }
    if (t === "devices") {
      const r = await api("/api/admin/devices");
      body.innerHTML = (r.data.devices || []).map((dv) => `<div class="spread" style="padding:10px 0;border-bottom:1px solid var(--line)">
        <span class="tiny">${esc(dv.label)} <span class="muted">· ${T.last_seen} ${new Date(dv.last_seen).toLocaleString(S.lang === "ar" ? "ar" : "en")}</span> ${dv.revoked ? `<span class="chip bad">${T.revoked_l}</span>` : ""}</span>
        ${!dv.revoked ? `<button class="btn danger sm" data-dv="${dv.id}">${T.revoke}</button>` : ""}</div>`).join("");
      $$("[data-dv]", body).forEach((b2) => b2.addEventListener("click", async () => { await api(`/api/admin/devices/${b2.dataset.dv}/revoke`, "POST", {}); render("devices"); }));
    }
    if (t === "finaudit") {
      const r = await api("/api/admin/audit-financial");
      body.innerHTML = (r.data.audit || []).map((a2) => `<div class="tiny muted" style="padding:6px 0;border-bottom:1px solid var(--line)">${new Date(a2.at).toLocaleString(S.lang === "ar" ? "ar" : "en")} — <b style="color:var(--fg)">${esc(a2.action)}</b> ${esc(a2.detail)}</div>`).join("") || `<div class="empty">—</div>`;
    }
  }
  await render("reviews");
}

// ═══ الإعداد لمرة واحدة + عرض رابط اللوحة ═══
function showPanelLink(url, isRotate = false) {
  const m = $("#modal"); m.hidden = false;
  const abs = location.origin + url;
  m.innerHTML = `<div class="modal">
    <b style="color:var(--warn);font-size:15px">${T.panel_warn_title}</b>
    <p class="tiny muted" style="margin:10px 0">${T.panel_warn}</p>
    <div class="spread" style="gap:8px;background:rgba(255,255,255,.04);border:1px solid var(--line2);border-radius:11px;padding:11px 13px">
      <code class="tiny ltr-force" style="word-break:break-all">${esc(abs)}</code>
    </div>
    <div class="row" style="margin-top:14px">
      <button class="btn primary sm" id="pl-copy">${T.panel_copy}</button>
      <a class="btn sm" id="pl-open" href="${esc(abs)}">${isRotate ? T.panel_open : ""}</a>
    </div></div>`;
  try { localStorage.setItem("nk_panel", url); } catch {}
  $("#pl-copy").onclick = async () => { try { await navigator.clipboard.writeText(abs); toast("✓"); } catch {} };
  $("#pl-open").onclick = () => { sessionStorage.removeItem("nk_setup"); };
}
async function viewSetup() {
  const st = await api("/api/admin/setup-status");
  if (st.ok && st.data.done) return shell(`<div class="empty"><div class="big">404</div>Not found.</div>`);
  shell(`<div class="wrap" style="max-width:520px;padding-top:60px">
    <div class="panel">
      <h2 style="font-size:19px;margin-bottom:8px">${T.setup_title}</h2>
      <p class="tiny muted" style="margin-bottom:18px">${T.setup_sub}</p>
      <div class="field"><label>${T.setup_name}</label><input id="su-name" /></div>
      <div class="field"><label>${T.setup_email}</label><input id="su-email" type="email" autocomplete="email" /></div>
      <div class="field"><label>${T.setup_pass}</label><input id="su-pass" type="password" placeholder="${T.setup_pass_hint}" /></div>
      <button class="btn primary" id="su-go" style="width:100%;justify-content:center">${T.setup_go}</button>
      <div class="msg" id="su-msg" hidden></div>
    </div></div>`, "");
  $("#su-go").onclick = async () => {
    const btn = $("#su-go"), msg = $("#su-msg");
    const name = $("#su-name").value.trim(), email = $("#su-email").value.trim(), pass = $("#su-pass").value;
    if (pass.length < 16 || !/[a-z]/.test(pass) || !/[A-Z]/.test(pass) || !/\d/.test(pass)) { msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText("invalid_setup"); return; }
    btn.disabled = true; btn.textContent = T.securing; msg.hidden = true;
    try {
      const k0 = await k0Of(email, pass);
      const r = await api("/api/admin/setup", "POST", { email, k0, name });
      if (!r.ok) throw r.data.error || "error";
      S.user = r.data.user; S.csrf = r.data.csrf;
      btn.disabled = false; btn.textContent = T.setup_go;
      showPanelLink(r.data.panel_url);
      $("#pl-open").textContent = T.panel_open;
      $("#pl-open").addEventListener("click", () => setTimeout(() => location.reload(), 100));
    } catch (e2) {
      msg.className = "msg bad"; msg.hidden = false; msg.textContent = errText(String(e2));
      btn.disabled = false; btn.textContent = T.setup_go;
    }
  };
}

// ═══ الأسعار ═══
async function viewPricing() {
  const r = await api("/api/plans");
  const plans = r.data.plans || [];
  const card = (pl) => `<div class="card card-pad" style="display:flex;flex-direction:column;gap:14px;${pl.id === "vip" ? "border-color:rgba(124,108,255,.45)" : ""}">
    <div class="spread"><b style="font-family:var(--display);font-size:18px">${esc(pl.name)}</b>${pl.active ? `<span class="chip ok">●</span>` : `<span class="chip warn">${T.coming_soon}</span>`}</div>
    <div><span class="price" style="font-size:28px">${pl.price_dzd ? money(pl.price_dzd) : T.free_forever}</span><span class="tiny muted">${pl.price_dzd ? " " + T.per_month : ""}</span></div>
    <div style="font-size:13px;color:var(--dim);line-height:2">${(() => { try { return JSON.parse(pl.features || "[]").map((f) => `<div>✓ ${esc(f)}</div>`).join(""); } catch { return ""; } })()}</div>
    ${pl.active ? `<a class="btn primary" style="justify-content:center" href="#/request/new">${T.choose_free}</a>` : `<button class="btn" disabled style="justify-content:center">${T.coming_soon}</button>`}
  </div>`;
  shell(`<div class="wrap page-head"><h1>${T.pricing}</h1><p>${T.pricing_sub}</p></div>
  <div class="wrap"><div class="t-grid" style="grid-template-columns:repeat(auto-fit,minmax(250px,1fr))">
    ${plans.map(card).join("") || `<div class="skel"></div>`}
  </div></div>`, "");
}

// ═══════════ الموجّه ═══════════
async function boot() {
  document.documentElement.lang = S.lang;
  document.documentElement.dir = S.lang === "ar" ? "rtl" : "ltr";
  let _savedPanel = ""; try { _savedPanel = localStorage.getItem("nk_panel") || ""; } catch {}
  if (location.pathname.startsWith("/panel/")) S.panel = location.pathname.slice("/panel/".length).replace(/\/+$/, "");
  else if (_savedPanel.startsWith("/panel/")) S.panel = _savedPanel.slice("/panel/".length);
  if (location.pathname === "/setup") location.hash = "#/setup";
  const me = await api("/api/me");
  S.user = me.data.user; S.csrf = me.data.csrf || null;
  S.plan = me.data.plan || null; S.ai = me.data.ai || null;
  const cats = await api("/api/categories");
  S.cats = cats.data.categories || [];
  route();
  window.addEventListener("hashchange", route);
}

async function route() {
  const hash = location.hash || "#/";
  const [path, qs] = hash.split("?");
  const params = new URLSearchParams(qs || "");
  const parts = path.replace(/^#\//, "").split("/");
  window.scrollTo({ top: 0 });
  try {
    if (parts[0] === "" || path === "#/") return viewHome();
    if (parts[0] === "talent") return viewTalent(params);
    if (parts[0] === "services") return parts[1] ? viewService(parts[1]) : viewServices(params);
    if (parts[0] === "u" && parts[1]) return viewProfile(parts[1]);
    if (parts[0] === "discover") return viewDiscover();
    if (parts[0] === "dashboard") return viewDashboard();
    if (parts[0] === "request") return parts[1] === "new" ? viewRequestNew() : viewRequest(parts[1]);
    if (parts[0] === "projects") return parts[1] ? viewProject(parts[1]) : viewDashboard();
    if (parts[0] === "ads") return viewAds();
    if (parts[0] === "pricing") return viewPricing();
    if (parts[0] === "setup") return viewSetup();
    if (parts[0] === "about") return viewAbout();
    if (parts[0] === "admin") return viewAdmin();
    return viewHome();
  } catch (e) {
    console.error(e);
    shell(`<div class="empty"><div class="big">⚠</div>${T.broke}</div>`);
  }
}

boot();
