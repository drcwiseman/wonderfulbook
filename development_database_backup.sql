--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: book_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.book_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    book_id character varying NOT NULL,
    category_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.book_categories OWNER TO neondb_owner;

--
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bookmarks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    book_id character varying NOT NULL,
    page integer NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.bookmarks OWNER TO neondb_owner;

--
-- Name: books; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.books (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    author text NOT NULL,
    description text,
    cover_image_url text,
    pdf_url text,
    rating numeric(3,2) DEFAULT 0.00,
    total_ratings integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    required_tier character varying DEFAULT 'free'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.books OWNER TO neondb_owner;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO neondb_owner;

--
-- Name: free_trial_abuse_prevention; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.free_trial_abuse_prevention (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    email_domain character varying NOT NULL,
    registration_ip character varying NOT NULL,
    device_fingerprint character varying,
    user_id character varying,
    free_trial_started_at timestamp without time zone NOT NULL,
    free_trial_ended_at timestamp without time zone,
    is_blocked boolean DEFAULT false,
    block_reason character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.free_trial_abuse_prevention OWNER TO neondb_owner;

--
-- Name: reading_progress; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reading_progress (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    book_id character varying NOT NULL,
    current_page integer DEFAULT 0,
    total_pages integer DEFAULT 0,
    progress_percentage numeric(5,2) DEFAULT 0.00,
    last_read_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reading_progress OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: signup_attempts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.signup_attempts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    registration_ip character varying NOT NULL,
    device_fingerprint character varying,
    attempted_at timestamp without time zone DEFAULT now(),
    successful boolean DEFAULT false,
    block_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.signup_attempts OWNER TO neondb_owner;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.subscription_plans (
    id character varying NOT NULL,
    name character varying NOT NULL,
    price character varying NOT NULL,
    price_amount integer NOT NULL,
    currency character varying DEFAULT 'GBP'::character varying,
    period character varying DEFAULT 'per month'::character varying,
    description text,
    book_limit integer DEFAULT 3,
    features text[],
    is_active boolean DEFAULT true,
    stripe_price_id character varying,
    display_order integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subscription_plans OWNER TO neondb_owner;

--
-- Name: user_selected_books; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_selected_books (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    book_id character varying NOT NULL,
    subscription_tier character varying NOT NULL,
    selected_at timestamp without time zone DEFAULT now(),
    locked_until timestamp without time zone NOT NULL,
    billing_cycle_start timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_selected_books OWNER TO neondb_owner;

--
-- Name: user_subscription_cycles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_subscription_cycles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    subscription_tier character varying NOT NULL,
    cycle_start timestamp without time zone NOT NULL,
    cycle_end timestamp without time zone NOT NULL,
    books_selected_count integer DEFAULT 0,
    max_books integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_subscription_cycles OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    stripe_customer_id character varying,
    stripe_subscription_id character varying,
    subscription_tier character varying DEFAULT 'free'::character varying,
    subscription_status character varying DEFAULT 'inactive'::character varying,
    books_read_this_month integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    role character varying DEFAULT 'user'::character varying,
    is_active boolean DEFAULT true,
    last_login_at timestamp without time zone,
    password_reset_token character varying,
    password_reset_expires timestamp without time zone,
    username character varying,
    password_hash character varying,
    email_verified boolean DEFAULT false,
    email_verification_token character varying,
    auth_provider character varying DEFAULT 'replit'::character varying,
    free_trial_used boolean DEFAULT false,
    free_trial_started_at timestamp without time zone,
    free_trial_ended_at timestamp without time zone,
    registration_ip character varying,
    device_fingerprint character varying
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: book_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.book_categories (id, book_id, category_id, created_at) FROM stdin;
b21147aa-841a-499b-bc43-11d4f23e92fa    39a430b3-9bfd-4d3d-a848-2b450f4cfe13    583d88b2-6e2a-475f-b865-a5b3c2884697    2025-08-06 04:11:16.969951
0f6ae493-7fe1-4a46-bba2-83a2c5e5c920    b9ad5b9d-2437-4ed8-be2b-6bb517ecd1aa    a4c59eaa-5ebd-42a8-b7e8-04f4e63031fb    2025-08-06 04:19:33.341399
50d33d8c-f633-4c7f-9b5b-3126be3ec85f    b9ad5b9d-2437-4ed8-be2b-6bb517ecd1aa    83b61722-36ba-41fe-9c38-6415062460c2    2025-08-06 04:19:33.341399
3cd1bad0-9c44-451d-b1b1-382f2616194c    ec226b44-4cd1-4e95-a21b-f3ae2f934cd3    53241b15-b372-4fff-be99-4bd9444f3bec    2025-08-06 04:21:29.360963
1e090264-b909-4407-812d-8e0e59450f15    deba8249-6ec8-4771-adc4-aa450387bd1a    53241b15-b372-4fff-be99-4bd9444f3bec    2025-08-06 04:23:16.50827
4e540300-6d51-4f7c-ab5e-a4e2afac94f2    82f9671f-5e8c-41dc-a8b0-22f1852e8532    299bbe0c-fa14-49e2-a67d-b2507954dc19    2025-08-06 04:33:41.809644
57de83c4-e344-4b0b-9e74-80be56aa674a    82f9671f-5e8c-41dc-a8b0-22f1852e8532    53241b15-b372-4fff-be99-4bd9444f3bec    2025-08-06 04:33:41.809644
0cf54ab9-f5da-4786-adbd-47777287f00e    2c38e9b8-a06c-40fa-a055-f55ebaef7edc    83b61722-36ba-41fe-9c38-6415062460c2    2025-08-06 04:36:39.921824
4b64ffc7-8d22-4180-b457-39418dd139b7    b3ff71d5-5637-4f9c-9eac-520afa80786f    53241b15-b372-4fff-be99-4bd9444f3bec    2025-08-06 04:48:48.517966
f70923ca-babe-4794-b7b5-c9c8a017b024    e147f9bd-67e4-4e09-b923-049ed63a0095    53241b15-b372-4fff-be99-4bd9444f3bec    2025-08-06 04:50:15.273961
9d5bddce-56b2-4f71-8704-da600213a614    e147f9bd-67e4-4e09-b923-049ed63a0095    a9215699-a948-4ce6-abba-d9a831a8705b    2025-08-06 04:50:15.273961
4b27065e-9c9c-43e7-99d8-14924e4ae541    b482f62a-165e-4379-a3eb-099efd4949f6    2a7e1f90-e3b9-499c-a99c-d0b663beb99b    2025-08-06 04:53:01.707075
b846e7fe-322c-4d7c-aded-4da89d0979db    b482f62a-165e-4379-a3eb-099efd4949f6    a9215699-a948-4ce6-abba-d9a831a8705b    2025-08-06 04:53:01.707075
91487863-f7d7-43f3-8ef4-5600b0d490c5    25eade19-d8ab-4c25-b9e9-7f2fc63d6808    a5ba7751-7702-44d3-8948-c0fcee7ddc35    2025-08-06 05:04:26.10821
960ea5e1-7617-4af9-9fb3-adc4fd865214    25eade19-d8ab-4c25-b9e9-7f2fc63d6808    5cb14315-07a5-4878-9604-e757b6cadc8d    2025-08-06 05:04:26.10821
\.


--
-- Data for Name: bookmarks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bookmarks (id, user_id, book_id, page, note, created_at) FROM stdin;
\.


--
-- Data for Name: books; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.books (id, title, author, description, cover_image_url, pdf_url, rating, total_ratings, is_featured, required_tier, created_at, updated_at) FROM stdin;
39a430b3-9bfd-4d3d-a848-2b450f4cfe13    Covenant Wealth: Unlocking God’s Divine Economy through Tithes, Offerings & First Fruits        Dr C Wiseman    <p><span class="my-custom-class" style="color: rgb(0, 0, 0);"><strong>Are you tired of giving… but still struggling?</strong><br>You tithe. You sow. You pray. Yet breakthrough seems delayed, and your finances feel stuck in a cycle of lack, fear, and frustration.</span></p><p><span class="my-custom-class" style="color: rgb(0, 0, 0);"><strong>You are not alone.</strong><br>Many believers live under open heavens but still experience closed doors—because they don’t understand&nbsp;<strong>God’s covenant economy.</strong></span></p><p><span class="my-custom-class" style="color: rgb(0, 0, 0);">If you’ve ever wondered:</span></p><ul><li><p><span class="my-custom-class" style="color: rgb(0, 0, 0);">“Why am I still broke when I’m faithful?”</span></p></li><li><p><span class="my-custom-class" style="color: rgb(0, 0, 0);">“Where is the harvest from my giving?”</span></p></li><li><p><span class="my-custom-class" style="color: rgb(0, 0, 0);">“Is there something I’m missing?”</span></p></li></ul><p><span class="my-custom-class" style="color: rgb(0, 0, 0);"><strong>This book is your answer.</strong></span></p><hr><p><span class="my-custom-class" style="color: rgb(0, 0, 0);">In&nbsp;<em>Covenant Wealth</em>, Master Prophet Dr. Climate Wiseman shares the prophetic revelation, personal testimonies, and biblical blueprint that took him from homelessness and a 25p tithe… to global abundance and supernatural provision.</span></p><p><span class="my-custom-class" style="color: rgb(0, 0, 0);"><strong>This is more than a book—it’s a divine reset for your finances.</strong><br>You’ll discover:</span></p><p><span class="my-custom-class" style="color: rgb(0, 0, 0);">✅ What the tithe really is—and how to activate its protection and provision<br>✅ Why offerings must speak—and how to sow for maximum return<br>✅ The power of First Fruits—and how one act of obedience can change your entire year<br>✅ How to avoid financial delay by breaking common giving mistakes<br>✅ How to live in the&nbsp;<em>covenant cycle</em>&nbsp;of Tithe → Offering → First Fruit → Harvest → Repeat</span></p><hr><h3><span class="my-custom-class" style="color: rgb(0, 0, 0);"><strong>This book is for you if:</strong></span></h3><ul><li><p><span class="my-custom-class" style="color: rgb(0, 0, 0);">You tithe, but still live paycheck to paycheck</span></p></li><li><p><span class="my-custom-class" style="color: rgb(0, 0, 0);">You want to sow prophetically, but don’t know how</span></p></li><li><p><span class="my-custom-class" style="color: rgb(0, 0, 0);">You desire financial breakthrough without compromising your faith</span></p></li><li><p><span class="my-custom-class" style="color: rgb(0, 0, 0);">You are a pastor, leader, or giver ready to teach or live the truth boldly</span></p></li><li><p><span class="my-custom-class" style="color: rgb(0, 0, 0);">You’ve been stuck in cycles of struggle and want to unlock lasting overflow</span></p></li></ul><hr><p><span class="my-custom-class" style="color: rgb(0, 0, 0);"><strong>You were never created to live in survival. You were born for covenant wealth.</strong><br>It’s time to align your giving with God’s divine economy—and watch the heavens open over your life.</span></p><h3><span class="my-custom-class" style="color: rgb(0, 0, 0);"><strong>📖&nbsp;<em>Your breakthrough is not delayed—your understanding is about to catch up.</em></strong></span></h3><p><span class="my-custom-class" style="color: rgb(0, 0, 0);"><strong>The blessing you’ve been longing for is one covenant decision away. Are you ready to walk in it?</strong></span></p> /uploads/1754453446477-kgg86a.png       /uploads/pdfs/1754453468245-7a2lh9.pdf  5.00    0       f       free    2025-08-06 04:11:16.890922      2025-08-06 04:11:16.890922
b9ad5b9d-2437-4ed8-be2b-6bb517ecd1aa    Multiply the Vision: A Practical Guide to Equipping Leaders Who Make Disciples  Dr C Wiseman    <p><strong>Are you ready to move beyond maintenance into true multiplication?</strong></p><p><strong>The Kingdom Temple isn’t called to be just another gathering place.</strong><br>It is a&nbsp;<em>spiritual stronghold</em>&nbsp;where captives are set free and disciples are planted to flourish.</p><p>But this vision can’t be fulfilled by passive spectators or reluctant helpers.<br>It demands&nbsp;<em>committed, equipped, and on-fire leaders</em>&nbsp;who know how to reproduce themselves over and over.</p><p>This manual is your&nbsp;<strong>blueprint</strong>&nbsp;for that kind of leadership.<br>It will challenge you, train you, and transform you—moving you from simply serving to truly&nbsp;<strong>multiplying</strong>.</p><p>Inside you’ll discover:</p><ul><li><p>How to conquer fear, laziness, offense, and hidden sin</p></li><li><p>How to invite, disciple, and train others to lead</p></li><li><p>How to build accountability, sustain personal revival, and prioritize God’s mission</p></li><li><p>How to create a culture of discipleship that reproduces for generations</p></li></ul><p>If you’re tired of watching church growth stall at programs and events…<br>If you’re burdened to see real lives changed, families restored, and your city impacted…<br>If you’re willing to pay the price to become the kind of leader God can trust with souls…</p><p><strong>This book is your call to arms.</strong></p><p>It’s time to take ownership.<br>It’s time to make disciples who make disciples.<br>It’s time to see The Kingdom Temple become everything God intended:<br>A place where the captives are set free, and all disciples are planted to flourish.</p><p><strong>Answer the call. Multiply the mission. Change the world.</strong></p>  /uploads/1754453929800-msice.png        /uploads/pdfs/1754453915874-oqutoa.pdf  5.00    0       f       free    2025-08-06 04:19:33.286573      2025-08-06 04:19:33.286573
ec226b44-4cd1-4e95-a21b-f3ae2f934cd3    30 Days to Break the Curse of “Almost There”: Your Step-By-Step Guide To Stop Near-Success Syndrome and Cross Your Finish Line  Dr C Wiseman    <p><strong>You were so close… again. But somehow, it slipped away.</strong><br>If your life has been a series of near-breakthroughs, unfinished dreams, and doors that open only to shut in your face, this book was written for you.</p><p><strong>The curse of “almost there” is real—and it ends now.</strong></p><p>Maybe you’ve worked hard, prayed harder, and still find yourself&nbsp;<strong>stuck in delay, sabotage, and spiritual resistance</strong>. You’ve watched others cross the finish line while you live in cycles of frustration, fear, and exhaustion.</p><p><strong>But what if the problem isn’t your effort… it’s the invisible barriers blocking your breakthrough?</strong></p><p>In&nbsp;<em>30 Days to Break the Curse of Almost There</em>, international prophet and spiritual strategist&nbsp;<strong>Dr. Climate Wiseman</strong>&nbsp;guides you through a transformational journey that exposes hidden patterns of delay and empowers you to&nbsp;<strong>finish what you start—once and for all</strong>.</p><p>This isn’t just a book—it’s a&nbsp;<strong>step-by-step prophetic process</strong>&nbsp;that will reset your mind, restore your momentum, and reignite your identity as a&nbsp;<strong>finisher</strong>.</p><hr><p><strong>Inside you’ll discover how to:</strong></p><ul><li><p>Break spiritual cycles of delay, disappointment, and distraction</p></li><li><p>Recognize emotional and environmental “almost there” triggers</p></li><li><p>Build finisher habits that lead to peace, progress, and purpose</p></li><li><p>Declare your breakthrough in advance—and watch it manifest</p></li><li><p>Seal your victory with prophetic prayer, action steps, and real-life application</p></li></ul><hr><p><strong>This book is for you if:</strong></p><ul><li><p>You always get close to success but never fully arrive</p></li><li><p>You start things with excitement but struggle to finish</p></li><li><p>You’re tired of doors opening—and closing—too soon</p></li><li><p>You’ve been through delays that drained your faith</p></li><li><p>You’re ready to break free and walk in the life God designed for you</p></li></ul><hr><p><strong>Written with power, compassion, and over 25 years of experience in helping thousands experience lasting breakthrough,</strong>&nbsp;Dr. Climate Wiseman gives you the tools to rewrite your story—one day at a time.</p><p><strong>You don’t have to live in the land of almost.<br>You were born to finish.<br>The peace, power, and purpose you’ve been longing for is just 30 days away.</strong></p><p><strong>Are you ready to cross your finish line?</strong></p>    /uploads/1754454058788-3eba19.png       /uploads/pdfs/1754454019850-f4821w.pdf  5.00    0       f       free    2025-08-06 04:21:29.31661       2025-08-06 04:21:29.31661
deba8249-6ec8-4771-adc4-aa450387bd1a    30 Days to Dismantle Evil Altars: Your Step-By-Step Guide To Tear Down Spiritual Structures Fighting Your Life  Dr C Wiseman    <p><strong>Are you tired of feeling stuck, overwhelmed, and weighed down by invisible forces you can’t control?</strong></p><p>You’ve tried everything, but the stress, fear, and confusion still linger. The battles in your life seem unending, and no matter how hard you fight, victory feels out of reach. If this sounds familiar, it’s time for a&nbsp;<strong>radical transformation</strong>.</p><p>This book is not just a guide—it’s your pathway to freedom. It’s designed to help you&nbsp;<strong>identify, dismantle, and remove</strong>the spiritual strongholds that have been blocking your peace, success, and joy. Through&nbsp;<strong>30 powerful days</strong>, you’ll take practical, actionable steps that will not only free your spirit but also bring&nbsp;<strong>lasting emotional healing</strong>&nbsp;and&nbsp;<strong>inner peace</strong>.</p><p><strong>Inside this book, you’ll discover:</strong></p><ul><li><p>How to recognize the&nbsp;<strong>hidden altars</strong>&nbsp;and negative spiritual structures that have been controlling your life.</p></li><li><p>Step-by-step guidance on how to&nbsp;<strong>tear them down</strong>and replace them with altars of freedom, worship, and divine authority.</p></li><li><p><strong>Emotional healing</strong>&nbsp;strategies that will restore your peace, clarity, and joy.</p></li><li><p>Proven methods to&nbsp;<strong>walk in spiritual authority</strong>, and maintain your breakthrough, so the enemy can’t regain a foothold in your life.</p></li></ul><hr><h3><strong>This book is for you if:</strong></h3><ul><li><p>You feel like you’re trapped in cycles of&nbsp;<strong>stress</strong>,&nbsp;<strong>fear</strong>, or&nbsp;<strong>hopelessness</strong>.</p></li><li><p>You’ve been struggling to find&nbsp;<strong>lasting peace</strong>&nbsp;and&nbsp;<strong>clarity</strong>&nbsp;in your life.</p></li><li><p>You sense that&nbsp;<strong>something spiritual</strong>&nbsp;is blocking your success and happiness.</p></li><li><p>You’re ready to experience&nbsp;<strong>freedom</strong>&nbsp;and&nbsp;<strong>breakthrough</strong>&nbsp;in all areas of your life.</p></li></ul><hr><p>In just&nbsp;<strong>30 days</strong>, you can&nbsp;<strong>tear down the spiritual walls</strong>holding you back and step into the life you were meant to live. This book is written with&nbsp;<strong>understanding</strong>,&nbsp;<strong>compassion</strong>, and&nbsp;<strong>practical wisdom</strong>, guiding you step-by-step to total freedom.</p><p>The peace you’ve been longing for is just 30 days away—<strong>are you ready to embrace it</strong>?</p><hr><p><strong>Take the first step toward your breakthrough today.</strong></p>      /uploads/1754454150690-j5ycd2.png       /uploads/pdfs/1754454138199-mlvw7.pdf   5.00    0       f       free    2025-08-06 04:23:16.463065      2025-08-06 04:23:16.463065
82f9671f-5e8c-41dc-a8b0-22f1852e8532    How to Build a Powerful Home Altar That Speaks, Protects & Releases Heaven’s Power in Your Daily Life   Dr C Wiseman    <p>You were never meant to live in a powerless house.</p><p>In the battles of life—whether they show up as delays, strange sicknesses, rebellious children, financial limitation, or spiritual confusion—God never intended for you to fight empty-handed. He designed a system, both ancient and prophetic, where Heaven responds to earth through the power of an altar.</p><p>The&nbsp;<strong>home altar</strong>&nbsp;is not just a piece of furniture or a sacred corner—it’s a spiritual technology. A divine access point. A place where your sacrifices speak louder than your enemies’ accusations. A prophetic gate where heaven meets your household and where fire is kindled daily to protect, direct, and empower you.</p><p>In church, there is a central altar where corporate power is released. But what happens when the warfare follows you home? When you feel spiritually attacked in the night? When your children are under siege? When something unseen is choking your progress—yet you’ve been praying, fasting, tithing, and nothing seems to shift?</p><p>That’s where the home altar comes in.</p><p>This book is a 28-chapter prophetic and practical journey to teach you:</p><ul><li><p><strong>How to build, dedicate, and protect your personal home altar</strong></p></li><li><p><strong>How to connect your home altar to your church altar for multiplied effect</strong></p></li><li><p><strong>How to activate divine protocols using oil, water, communion, prayer, and sacrifice</strong></p></li><li><p><strong>How to guard your altar from defilement and strange fire</strong></p></li><li><p><strong>How to release prophetic fire that speaks louder than any curse, witchcraft, or legal accusation</strong></p></li><li><p><strong>How to raise family altars that cover your children, restore marriages, and secure legacy</strong></p></li><li><p><strong>And ultimately, how to become a walking altar yourself—carrying divine presence and power wherever you go</strong></p></li></ul><p>This is not just about setting up a sacred place—it’s about unlocking divine patterns and supernatural systems that govern victories, covenant, restoration, and legacy.</p><p>Throughout these 28 chapters, you’ll also discover:</p><p>✅ Hidden biblical secrets from Abraham, Elijah, David, and Jesus<br>✅ Real-life testimonies of breakthrough and deliverance from believers around the world<br>✅ Prophetic activations to anoint your home, break generational cycles, and recover stolen blessings<br>✅ Step-by-step guides for cleansing, rededication, and aligning your altar with God’s timing</p><hr><h3><strong>Who Is This Book For?</strong></h3><p>This book is for the spiritual warrior who is tired of recycled battles.<br>It’s for the prayerful mother who wants to secure her children’s destiny.<br>It’s for the business owner who senses invisible resistance.<br>It’s for the prophetic intercessor, the pastor, the home leader, the frustrated believer who feels like something spiritual is “off”—and is finally ready to fix it.</p><hr><h3><strong>A Word from the Author</strong></h3><p>For over two decades, I’ve seen firsthand how altars rule outcomes.<br>Some people’s lives are blocked because of evil altars in their bloodline. Others struggle because their altar at home is silent, defiled, or never existed. But when the right altar is raised and honored properly—miracles happen. I’ve seen barrenness end, marriages restored, finances explode, curses reversed, and demons silenced.</p><p>In&nbsp;<em>How to Build a Powerful Home Altar</em>, I’ll walk you step-by-step through this sacred yet practical process. Whether you’re new to this or deeply seasoned, this book will equip you to experience God’s presence, power, and prophetic guidance like never before.</p><p>Are you ready to build an altar that speaks louder than any attack?</p><p>Then let’s begin.</p><p>—<br><strong>Dr. Climate Wiseman</strong></p>      /uploads/1754454759109-pm9ru.png        /uploads/pdfs/1754454747556-ejj37p.pdf  5.00    0       f       free    2025-08-06 04:33:41.757605      2025-08-06 04:33:41.757605
2c38e9b8-a06c-40fa-a055-f55ebaef7edc    Planted to Flourish: The Power of Being Rooted in God’s House   Dr C Wiseman    <p><strong>Planted to Flourish: The Power of Being Rooted in God’s House</strong></p><p>What if you could live a life that feels anchored, secure, and overflowing with purpose? What if you could experience real belonging, deep growth, and unshakable peace?</p><p><strong>You can.</strong></p><p><strong>Planted to Flourish</strong>&nbsp;is your invitation to discover the joy and strength that comes from being truly rooted in God’s house. This isn’t just about attending church—it’s about finding your spiritual family, growing deep roots of faith, and living the abundant life God designed for you.</p><p>Inside these pages, you’ll uncover:</p><ul><li><p>The beauty and power of spiritual commitment.</p></li><li><p>How to cultivate unbreakable unity and authentic community.</p></li><li><p>Practical steps to heal from past hurts and embrace lasting connection.</p></li><li><p>Inspiring prayers and prophetic declarations to seal your covenant with God.</p></li><li><p>A clear path to receive&nbsp;<strong>Divine Direction, Divine Connection, Divine Provision, and Divine Protection.</strong></p></li></ul><p><strong>This book is for you if you:</strong></p><ul><li><p>Long to find your place and purpose in God’s family.</p></li><li><p>Want to deepen your faith and bear lasting fruit.</p></li><li><p>Desire strong, healthy relationships built on love and trust.</p></li><li><p>Feel called to strengthen your church and transform your community.</p></li><li><p>Dream of leaving a spiritual legacy that impacts generations.</p></li></ul><p><strong>Planted to Flourish</strong>&nbsp;offers you more than insight—it offers you transformation. It’s a guide to stepping into the life God has promised: a life of stability, fruitfulness, and profound joy.</p><p><strong>You were created to be planted. You were destined to flourish.</strong></p><p><strong>Your journey to a deeply rooted, thriving life begins here. Are you ready to embrace it?</strong></p>     /uploads/1754454964404-hyn8.png /uploads/pdfs/1754454880444-jt4n8q.pdf  5.00    0       f       free    2025-08-06 04:36:39.857776      2025-08-06 04:36:39.857776
b3ff71d5-5637-4f9c-9eac-520afa80786f    30 Days to Overcome Spiritual Blockages: Break Invisible Resistance, Dismantle Demonic Roadblocks, and Release Divine Flow      Dr C Wiseman    <p><strong>Something unseen is standing in your way—and you can feel it.</strong></p><p>You’ve prayed. You’ve fasted. You’ve tried everything. Yet the doors won’t open, your progress is delayed, and breakthrough feels just out of reach. It’s not your imagination. You’re up against spiritual blockages—<strong>invisible barriers designed to keep you stuck.</strong></p><p>If you’re weary of frustration and ready for freedom, this book is your prophetic lifeline.</p><p><strong>30 Days to Overcome Spiritual Blockages</strong>&nbsp;is a powerful, step-by-step journey designed to help you identify, confront, and dismantle the spiritual resistance holding you back. Whether you’re battling delay, confusion, spiritual heaviness, or a sense of unexplainable oppression, this 30-day guide gives you the&nbsp;<strong>tools to break through and flow again.</strong></p><p>You’ll uncover:</p><p>✅ Hidden emotional wounds acting as spiritual entry points<br>✅ Demonic checkpoints stationed at your breakthrough moments<br>✅ Cursed objects, soul ties, and atmospheres blocking your peace<br>✅ How to use oil, fasting, prophetic actions, and strategic declarations<br>✅ Daily rituals to restore divine momentum, clarity, and alignment</p><p>Each day includes prophetic teaching, journaling prompts, real testimonies, targeted declarations, and warfare prayer points that will help you regain spiritual control and release divine flow.</p><p><strong>This book is for you if:</strong></p><ul><li><p>You feel spiritually stuck, heavy, or delayed</p></li><li><p>You’ve experienced sudden losses, rejection, or repeated near-misses</p></li><li><p>You battle confusion, anxiety, or constant spiritual fatigue</p></li><li><p>You want to restore consistent peace, direction, and supernatural favor</p></li><li><p>You’re ready to step into a life of power, progress, and prophetic flow</p></li></ul><p>You don’t have to keep fighting blind.<br>You don’t have to keep wondering why nothing’s moving.</p><p><strong>The peace, clarity, and breakthrough you’ve been praying for is just 30 days away.</strong><br><strong>Are you ready to embrace it?</strong></p>    /uploads/1754455646217-rzvup.png        /uploads/pdfs/1754455632785-zprlp.pdf   5.00    0       f       free    2025-08-06 04:48:48.453352      2025-08-06 04:48:48.453352
e147f9bd-67e4-4e09-b923-049ed63a0095    30 Days to Overcome Family Dysfunction: Healing From the Pain of Broken Roles, Toxic Patterns, and Divided Homes        Dr C Wiseman    <p><strong>What do you do when the people who were supposed to love you became the source of your deepest wounds?</strong></p><p>The silence. The screaming. The secrets.<br>You’ve tried to hold the family together. You’ve tried to pray it away, reason it out, or just survive another day. But behind closed doors, the dysfunction keeps growing—and it’s taking a toll on your mind, your peace, and your sense of worth.</p><p>Whether you come from a broken marriage, a controlling parent, a hostile stepfamily, or a generational mess that no one wants to talk about—<strong>this book was written for you.</strong></p><p><strong>In just 30 days, you can begin a healing journey that will:</strong></p><ul><li><p>Break toxic emotional patterns passed down through generations</p></li><li><p>Help you set boundaries without losing your heart</p></li><li><p>Heal your identity from parental wounds and childhood chaos</p></li><li><p>Restore clarity where confusion once reigned</p></li><li><p>Equip you to build a peaceful home—even if others stay toxic</p></li><li><p>Free you from guilt, fear, and silent suffering</p></li></ul><p><strong>This book doesn’t just talk about dysfunction—it walks you out of it.</strong></p><p>Every chapter includes real-life stories, prophetic insights, journal prompts, daily action steps, prayers, and declarations that confront deep-rooted pain with spiritual truth and practical strategies. Written with compassion and clarity,&nbsp;<em>30 Days to Overcome Family Dysfunction</em>&nbsp;gives you the structure and support you need to reset your life—without pretending, suppressing, or enabling toxic behavior any longer.</p><p><strong>This book is for you if you:</strong></p><ul><li><p>Grew up in a home where love was conditional, chaotic, or absent</p></li><li><p>Are raising children but afraid of repeating the same mistakes</p></li><li><p>Feel like the “black sheep” or emotional caretaker in your family</p></li><li><p>Struggle with guilt, anger, or people-pleasing because of family trauma</p></li><li><p>Want to change the future for the next generation—starting with yourself</p></li></ul><p><strong>The peace you’ve been longing for is just 30 days away. Are you ready to embrace it?</strong></p>        /uploads/1754455767227-ptcfl.png        /uploads/pdfs/1754455757797-ta3v7.pdf   4.00    0       f       free    2025-08-06 04:50:15.229619      2025-08-06 04:50:15.229619
b482f62a-165e-4379-a3eb-099efd4949f6    30 Days to Break the Curse of Late Marriage: Your Step By Step Guide To Unlock Your God-Ordained Relationship Season    Dr C Wiseman    <p><strong>You’ve waited. You’ve prayed. But nothing has changed—until now.</strong></p><p>If you’ve ever felt like love has passed you by…<br>If you’ve watched others step into marriage while you silently wonder, “What’s wrong with me?”…<br>If your heart aches every time another year goes by and your prayers seem unanswered…</p><p><strong>You are not alone—and this book was written for you.</strong></p><p><em>30 Days to Break the Curse of Late Marriage</em>&nbsp;is a powerful, step-by-step deliverance manual designed to expose and break every spiritual, emotional, and generational barrier blocking your God-ordained relationship season.</p><p>Through proven prophetic strategies, daily healing exercises, and intentional prayers, Bishop Climate Wiseman guides you through the inner transformation that attracts divine alignment.</p><p>You won’t just learn how to wait—you’ll learn how to&nbsp;<strong>break through</strong>.</p><h3><strong>In 30 Days, You Will:</strong></h3><ul><li><p>Uproot invisible curses causing relationship delays</p></li><li><p>Heal emotional wounds that sabotage divine connections</p></li><li><p>Identify and reject counterfeit relationships</p></li><li><p>Pray strategically for your future spouse</p></li><li><p>Rediscover your identity and worth</p></li><li><p>Enter into a season of divine exposure, favor, and covenant fulfillment</p></li></ul><p>This book is not about wishful thinking—it’s about&nbsp;<strong>warfare</strong>,&nbsp;<strong>wisdom</strong>, and&nbsp;<strong>winning</strong>&nbsp;in your relationship destiny.</p><hr><h3><strong>This Book Is For You If:</strong></h3><ul><li><p>You’ve experienced repeated heartbreak or betrayal</p></li><li><p>You feel overlooked or invisible despite your prayers</p></li><li><p>There is a history of late marriage or singleness in your family</p></li><li><p>You’re tired of surface solutions and are ready for spiritual depth</p></li><li><p>You desire to marry right, marry well, and marry on time</p></li></ul><p><strong>You’re not delayed—you’re being prepared. And this is your time.</strong></p><p><strong>The breakthrough you’ve been waiting for is just 30 days away.</strong><br><strong>Are you ready to embrace it?</strong></p>     /uploads/1754455927265-l74pyc.png       /uploads/pdfs/1754455921052-vkihvn.pdf  4.00    0       f       free    2025-08-06 04:53:01.644062      2025-08-06 04:53:01.644062
25eade19-d8ab-4c25-b9e9-7f2fc63d6808    30 Days To Develop A Spirit Of Excellence: Your Step By Step Guide To Mastering Character, Competence, and Calling in the Professional World    Dr C Wiseman    <p><strong>30 Days to a Spirit of Excellence: Mastering Character, Competence, and Calling in the Professional World</strong></p><p>Are you tired of doing your best and still feeling overlooked, misunderstood, or stuck?<br>Do you know you were made for more—but can’t seem to break through?</p><p>In a world driven by speed, status, and shortcuts,&nbsp;<em>excellence</em>&nbsp;often gets buried under exhaustion. You want to stand out—but without selling out. You want to rise—but without losing yourself. You want to fulfill your calling—but without compromising your character.</p><p>This is the book that bridges the gap.</p><p><strong><em>30 Days to a Spirit of Excellence</em></strong>&nbsp;is a transformational journey that will recalibrate your mindset, refine your habits, and reignite your passion to lead with integrity, perform with mastery, and walk boldly in your divine assignment.</p><p>With 30 days of daily wisdom, prophetic strategies, reflective prompts, and real-life breakthroughs, you’ll learn how to:</p><p>✅ Develop unshakable character in hostile environments<br>✅ Master professional competence without burnout<br>✅ Maintain your values while climbing higher<br>✅ Create influence without arrogance<br>✅ Recover your joy, clarity, and inner strength<br>✅ Rise without retaliation, compromise, or fear</p><p>This isn’t just another motivational book.<br>It’s a spiritual roadmap to&nbsp;<em>becoming the person your purpose has been waiting for.</em></p><p><strong>This book is for you if:</strong></p><ul><li><p>You’re a professional struggling to balance ambition with authenticity</p></li><li><p>You’re called to leadership but feel spiritually unprepared</p></li><li><p>You’re tired of mediocrity and ready to stand out with integrity</p></li><li><p>You want to build a legacy without losing your soul</p></li><li><p>You believe God has more for you—but need the blueprint to walk it out</p></li></ul><p>Written with deep compassion, prophetic insight, and practical steps,&nbsp;<em>30 Days to a Spirit of Excellence</em>&nbsp;will help you rise—one day, one habit, and one victory at a time.</p><p><strong>The clarity, confidence, and calling you’ve been searching for is just 30 days away. Are you ready to embrace it?</strong></p>        /uploads/1754456325388-e4zopo.png       /uploads/pdfs/1754456339085-vev1pj.pdf  5.00    0       f       free    2025-08-06 04:59:37.649894      2025-08-06 04:59:37.649894
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.categories (id, name, description, is_active, created_at, updated_at) FROM stdin;
53241b15-b372-4fff-be99-4bd9444f3bec    Deliverance & Spiritual Warfare \N      t       2025-08-06 03:32:21.005878      2025-08-06 03:32:21.005878
08ad538c-8d99-4680-8e88-e05226b229cc    Emotional Healing & Resilience  \N      t       2025-08-06 03:32:34.954784      2025-08-06 03:32:34.954784
583d88b2-6e2a-475f-b865-a5b3c2884697    Finances        \N      t       2025-08-06 03:32:46.400488      2025-08-06 03:32:46.400488
5de58c47-da7b-442d-9302-db0c5410f770    Business        \N      t       2025-08-06 03:32:53.947717      2025-08-06 03:32:53.947717
75558899-e123-44fe-9f4c-2984f02dd12b    Parenting       \N      t       2025-08-06 03:33:24.848615      2025-08-06 03:33:24.848615
ed399043-7f11-4419-86ac-7effbfa1b1ea    Personal Growth & Confidence    \N      t       2025-08-06 03:33:37.434129      2025-08-06 03:33:37.434129
6a5d9420-e287-456a-93e0-a1924cb6a266    Productivity & Purpose  \N      t       2025-08-06 03:33:54.111785      2025-08-06 03:33:54.111785
a9215699-a948-4ce6-abba-d9a831a8705b    Relationships   \N      t       2025-08-06 03:34:05.429692      2025-08-06 03:34:05.429692
039a4685-83b4-447c-884d-3e61540744e3    Spiritual Empowerment   \N      t       2025-08-06 03:34:19.744404      2025-08-06 03:34:19.744404
a5ba7751-7702-44d3-8948-c0fcee7ddc35    Leadership      \N      t       2025-08-06 03:34:38.322691      2025-08-06 03:34:38.322691
b385b142-5047-4405-b06d-e3e40068f952    Wisdom  \N      t       2025-08-06 03:34:45.344408      2025-08-06 03:34:45.344408
13303ebc-92c2-46bf-8b84-56fea2a1a82d    Kids    \N      t       2025-08-06 03:34:56.297128      2025-08-06 03:34:56.297128
83b61722-36ba-41fe-9c38-6415062460c2    Church Building \N      t       2025-08-06 03:38:29.084397      2025-08-06 03:38:29.084397
a4c59eaa-5ebd-42a8-b7e8-04f4e63031fb    Church Leadership       \N      t       2025-08-06 03:38:39.235722      2025-08-06 03:38:39.235722
2a7e1f90-e3b9-499c-a99c-d0b663beb99b    Marriage        \N      t       2025-08-06 03:39:09.166398      2025-08-06 03:39:09.166398
299bbe0c-fa14-49e2-a67d-b2507954dc19    Prayer  \N      t       2025-08-06 03:39:47.797854      2025-08-06 03:39:47.797854
ee1edc34-e072-4174-bc47-c547a081a6aa    Health  \N      t       2025-08-06 03:40:31.011385      2025-08-06 03:40:31.011385
90a38836-a376-458b-b65f-625c6c3be5a4    Healing         \N      t       2025-08-06 03:40:37.351308      2025-08-06 03:40:37.351308
ada1bb48-cf33-4774-a206-fa412f542652    Destiny         \N      t       2025-08-06 03:40:48.099957      2025-08-06 03:40:48.099957
5cb14315-07a5-4878-9604-e757b6cadc8d    Professionals   \N      t       2025-08-06 03:41:04.858091      2025-08-06 03:41:04.858091
06a66f56-76c0-4871-b292-db00f6ff5d27    Knowledge       \N      t       2025-08-06 03:41:22.696534      2025-08-06 03:41:22.696534
4c51564c-b47f-401e-bf83-746a58797429     Romance        \N      t       2025-08-06 03:39:01.669928      2025-08-06 03:41:28.073
bfeccfb7-c11a-40a8-8677-33915f20649c    Family  \N      t       2025-08-06 04:50:30.098631      2025-08-06 04:50:30.098631
\.


--
-- Data for Name: free_trial_abuse_prevention; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.free_trial_abuse_prevention (id, email, email_domain, registration_ip, device_fingerprint, user_id, free_trial_started_at, free_trial_ended_at, is_blocked, block_reason, created_at, updated_at) FROM stdin;
66e5b2b2-c8fe-4e4a-b219-b4485e9e1156    legit.user@example.com  example.com     127.0.0.1       device123abc    sXhr2fS2egIH    2025-08-06 10:21:05.839 2025-08-13 10:21:05.839 f       \N      2025-08-06 10:21:05.851552      2025-08-06 10:21:05.851552
2da017cf-c1d4-4d1d-96b6-6fb4ce645f7d    ratelimit1@example.com  example.com     192.168.1.100   device1xyz      E1x23SjCzjEV    2025-08-06 10:21:06.767 2025-08-13 10:21:06.767 f       \N      2025-08-06 10:21:06.778864      2025-08-06 10:21:06.778864
\.


--
-- Data for Name: reading_progress; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reading_progress (id, user_id, book_id, current_page, total_pages, progress_percentage, last_read_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
3pF9zGGfe2Nplzsy_kZAbRyhr_4TIlYx        {"cookie": {"path": "/", "secure": true, "expires": "2025-08-13T02:05:52.678Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "RCwS9JMGndnVYP_CcfBEkWNXEvTkkSUn7Dx3ngpTBcM"}} 2025-08-13 02:05:53
51w_2XoVW591I4VWZklW8xR-SGAuUIIk        {"cookie": {"path": "/", "secure": true, "expires": "2025-08-13T05:51:44.767Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "YH4LdJs7Mlecgwn8AHmYpEhcfjgikTni1IweqG3nBm0"}} 2025-08-13 05:51:45
TT2EQUNFfdU5OF56QN9KZhsRZq1Kqvd9        {"cookie": {"path": "/", "secure": true, "expires": "2025-08-13T08:26:31.955Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "di2O3E6bDYAH", "email": "john.doe@example.com"}, "expires_at": 1754555191, "access_token": "local_auth_token"}}}       2025-08-13 08:26:32
Ca9fSaZXUCHSZbz-txxbRtOpoewfYxVr        {"cookie": {"path": "/", "secure": true, "expires": "2025-08-13T08:29:31.786Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"sub": "di2O3E6bDYAH", "email": "john.doe@example.com"}, "expires_at": 1754555371, "access_token": "local_auth_token"}}}       2025-08-13 08:29:32
yLGCfxpaSK3OtDXH8M_u0zq4zJ-JqLB-        {"user": {"id": "di2O3E6bDYAH", "email": "john.doe@example.com", "lastName": "Doe", "firstName": "John"}, "cookie": {"path": "/", "secure": false, "expires": "2025-08-13T08:32:42.244Z", "httpOnly": true, "originalMaxAge": 604800000}}       2025-08-13 08:32:43
JyqG9cirRVBDCphL72W5zZ6RSVfjvjoa        {"user": {"id": "manual_1754457852879_osie0x", "email": "prophetclimate@yahoo.com", "lastName": "Wiseman", "firstName": "Climate"}, "cookie": {"path": "/", "secure": false, "expires": "2025-08-13T09:48:20.037Z", "httpOnly": true, "originalMaxAge": 604799999}}     2025-08-13 09:56:43
wJmz3LYnwQ1eBqC2onIq_YsavSsMXRMq        {"user": {"id": "manual_1754457852879_osie0x", "email": "prophetclimate@yahoo.com", "lastName": "Wiseman", "firstName": "Climate"}, "cookie": {"path": "/", "secure": false, "expires": "2025-08-13T10:40:02.547Z", "httpOnly": true, "originalMaxAge": 604800000}}     2025-08-13 10:40:03
ujAQMOQq-Yp0ksk_za_7cIQDTmCNiXNU        {"user": {"id": "manual_1754457852879_osie0x", "email": "prophetclimate@yahoo.com", "lastName": "Wiseman", "firstName": "Climate"}, "cookie": {"path": "/", "secure": false, "expires": "2025-08-13T09:41:58.957Z", "httpOnly": true, "originalMaxAge": 604800000}}     2025-08-13 16:33:16
VkOj4kJMTWtNZuI9nyV-IZ4j4KUIxSH_        {"user": {"id": "manual_1754457852879_osie0x", "email": "prophetclimate@yahoo.com", "lastName": "Wiseman", "firstName": "Climate"}, "cookie": {"path": "/", "secure": false, "expires": "2025-08-13T09:45:34.683Z", "httpOnly": true, "originalMaxAge": 604800000}}     2025-08-13 09:46:55
qrFroN7X2W5rEKxuzw0gzUmfRxbvXd9b        {"user": {"id": "di2O3E6bDYAH", "email": "john.doe@example.com", "lastName": "Doe", "firstName": "John"}, "cookie": {"path": "/", "secure": false, "expires": "2025-08-13T08:29:47.666Z", "httpOnly": true, "originalMaxAge": 604800000}}       2025-08-13 09:45:28
yrYnbGhoIjQB1i0BBo46TfCKL41xC4F_        {"user": {"id": "manual_1754457852879_osie0x", "email": "prophetclimate@yahoo.com", "lastName": "Wiseman", "firstName": "Climate"}, "cookie": {"path": "/", "secure": false, "expires": "2025-08-13T08:36:58.985Z", "httpOnly": true, "originalMaxAge": 604800000}}     2025-08-13 08:37:00
W7v154kFRREfdg--PgP8yM2l5zlRq9eL        {"user": {"id": "manual_1754457852879_osie0x", "email": "prophetclimate@yahoo.com", "lastName": "Wiseman", "firstName": "Climate"}, "cookie": {"path": "/", "secure": false, "expires": "2025-08-13T09:47:03.592Z", "httpOnly": true, "originalMaxAge": 604800000}}     2025-08-13 09:48:08
IdeUmeoO7p0NZVA48clziYuQumIM-rDk        {"user": {"id": "manual_1754457852879_osie0x", "email": "prophetclimate@yahoo.com", "lastName": "Wiseman", "firstName": "Climate"}, "cookie": {"path": "/", "secure": false, "expires": "2025-08-13T09:50:55.562Z", "httpOnly": true, "originalMaxAge": 604800000}}     2025-08-13 09:50:56
FL6APv8ChUmoCWIvfiAdFgwoJDnY3ezK        {"cookie": {"path": "/", "secure": true, "expires": "2025-08-13T07:10:11.772Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "4tthEXJRoIvGYT96Fsp4nbigy3m8wVzgIwJHMmp0Kv4"}} 2025-08-13 07:10:12
1x_6EHX9yxGl35Mxx1apqLYrXXu3brIx        {"user": {"id": "manual_1754457852879_osie0x", "email": "prophetclimate@yahoo.com", "lastName": "Wiseman", "firstName": "Climate"}, "cookie": {"path": "/", "secure": false, "expires": "2025-08-13T09:19:17.173Z", "httpOnly": true, "originalMaxAge": 604800000}}     2025-08-13 10:58:45
\.


--
-- Data for Name: signup_attempts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.signup_attempts (id, email, registration_ip, device_fingerprint, attempted_at, successful, block_until, created_at) FROM stdin;
f2922669-67cd-491b-995c-265b77cb5957    legit.user@example.com  127.0.0.1       device123abc    2025-08-06 10:21:05.891 t       \N      2025-08-06 10:21:05.90332
9d5e0919-319f-4661-aa33-2f5a0480809c    legit.user@example.com  127.0.0.1       device456def    2025-08-06 10:21:06.03  f       \N      2025-08-06 10:21:06.042699
c5c517bd-0b37-48e8-ae3f-3d90e3147c46    another.user@example.com        127.0.0.1       device123abc    2025-08-06 10:21:06.18  f       \N      2025-08-06 10:21:06.19295
4111c9d3-eea8-42c5-aa32-ea1a1b0cc692    ratelimit1@example.com  192.168.1.100   device1xyz      2025-08-06 10:21:06.815 t       \N      2025-08-06 10:21:06.827055
fd421f51-7f98-4277-a7a7-7a3438e4046b    ratelimit2@example.com  192.168.1.100   device2xyz      2025-08-06 10:21:06.962 f       \N      2025-08-06 10:21:06.974971
d9aba492-9d8c-4289-8d1c-c3a4dfe4251a    ratelimit3@example.com  192.168.1.100   device3xyz      2025-08-06 10:21:07.111 f       \N      2025-08-06 10:21:07.145031
3574219d-c9e0-4300-8910-75b7c82e4030    \N      192.168.1.100   \N      2025-08-06 10:21:07.208 f       2025-08-06 11:21:07.208 2025-08-06 10:21:07.220204
401f5a73-9b78-4a73-b015-8fc755607d22    ratelimit4@example.com  192.168.1.100   device4xyz      2025-08-06 10:21:07.231 f       \N      2025-08-06 10:21:07.244302
946bf376-09b7-4efa-af91-79f3ebcfec78    \N      127.0.0.1       \N      2025-08-06 10:22:44.229 f       2025-08-06 11:22:44.229 2025-08-06 10:22:44.239859
43691957-d845-41e6-9995-b0ae9482a48c    legit.user@example.com  127.0.0.1       device123abc    2025-08-06 10:22:44.252 f       \N      2025-08-06 10:22:44.263923
e141a1b4-6804-41d5-a8cd-d1f3aae2460f    legit.user@example.com  127.0.0.1       device456def    2025-08-06 10:22:44.361 f       \N      2025-08-06 10:22:44.372763
7bc06609-9eb9-430d-9152-bb1f9146d2ac    another.user@example.com        127.0.0.1       device123abc    2025-08-06 10:22:44.412 f       \N      2025-08-06 10:22:44.424265
fb29ca08-2575-494c-b9b5-9abb4423293d    ratelimit1@example.com  192.168.1.100   device1xyz      2025-08-06 10:22:44.463 f       \N      2025-08-06 10:22:44.474994
c66d0ec8-6d91-4f84-90b4-e07f61d3f8a9    ratelimit2@example.com  192.168.1.100   device2xyz      2025-08-06 10:22:44.524 f       \N      2025-08-06 10:22:44.535857
31757f5f-9027-466e-b9c7-5e1ce8941a45    ratelimit3@example.com  192.168.1.100   device3xyz      2025-08-06 10:22:44.582 f       \N      2025-08-06 10:22:44.59349
a9fd22b6-ddfb-4969-a982-85d1d886db92    ratelimit4@example.com  192.168.1.100   device4xyz      2025-08-06 10:22:44.629 f       \N      2025-08-06 10:22:44.640747
01e86b42-8fb3-4e77-b025-f5e5db3dbde5    test.duplicate@example.com      192.168.1.100   device123abc    2025-08-06 10:22:52.002 f       \N      2025-08-06 10:22:52.013874
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.subscription_plans (id, name, price, price_amount, currency, period, description, book_limit, features, is_active, stripe_price_id, display_order, created_at, updated_at) FROM stdin;
basic   Basic Plan      £5.99   999     GBP     per month       Great for regular readers       10      {"Access to 10 books per month","All reading features","Progress tracking & bookmarks","Mobile & desktop access","Customer support","Offline reading"}  t       \N      2       2025-08-06 09:48:47.496294      2025-08-06 09:52:17.2
premium Premium Plan    £9.99   1999    GBP     per month       Best value for book lovers      -1      {"Unlimited access to all books","All premium features","Advanced analytics","Priority customer support","Exclusive early access","Download for offline reading","Multi-device sync","Ad-free experience"}      t       \N      3       2025-08-06 09:48:47.496294      2025-08-06 09:52:36.397
free    Free Trial      £0      0       GBP     7 days free     Perfect for getting started - 7 days free trial 3       {"Access to 3 books for 7 days","Basic reading features","Progress tracking","Mobile & desktop access","No credit card required","Upgrade anytime to continue reading"} t       \N      1       2025-08-06 09:48:47.496294      2025-08-06 09:55:55.231339
\.


--
-- Data for Name: user_selected_books; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_selected_books (id, user_id, book_id, subscription_tier, selected_at, locked_until, billing_cycle_start, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_subscription_cycles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_subscription_cycles (id, user_id, subscription_tier, cycle_start, cycle_end, books_selected_count, max_books, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, stripe_customer_id, stripe_subscription_id, subscription_tier, subscription_status, books_read_this_month, created_at, updated_at, role, is_active, last_login_at, password_reset_token, password_reset_expires, username, password_hash, email_verified, email_verification_token, auth_provider, free_trial_used, free_trial_started_at, free_trial_ended_at, registration_ip, device_fingerprint) FROM stdin;
manual_1754458720041_g5ls46     bishopclimate@gmail.com Bishop  Brave   \N      \N      \N      basic   active  0       2025-08-06 05:38:40.041 2025-08-06 05:57:12.235 user    t       \N      \N      \N      \N      \N      f       \N      replit  f       \N      \N      \N      \N
test_free_user  free@test.com   Free    User    \N      \N      \N      free    active  0       2025-08-06 10:15:35.02298       2025-08-06 10:15:35.02298       user    t       \N      \N      \N      \N      \N      f       \N      replit  f       \N      \N      \N      \N
VCK6Zukaqhvl    jane.smith@example.com  Jane    Smith   \N      \N      \N      free    inactive        0       2025-08-06 08:26:33.470907      2025-08-06 08:26:33.470907      user    t       \N      \N      \N      janesmith456    \N      f       7bTqq-DHGfvlCuGViDbeFep4DIQEaIaI        local   f       \N      \N      \N      \N
test_basic_user basic@test.com  Basic   User    \N      \N      \N      basic   active  0       2025-08-06 10:15:36.495818      2025-08-06 10:15:36.495818      user    t       \N      \N      \N      \N      \N      f       \N      replit  f       \N      \N      \N      \N
45814604        drcwiseman@gmail.com    Climate Wiseman \N      cus_SoZmPL99Jouv4l      sub_1Rswm0Aogy3qVYfGwWa8KQhc    basic   active  0       2025-08-06 01:18:07.108252      2025-08-06 08:27:17.434 admin   t       \N      \N      \N      \N      \N      f       \N      replit  f       \N      \N      \N      \N
sXhr2fS2egIH    legit.user@example.com  Legit   User    \N      \N      \N      free    active  0       2025-08-06 10:21:05.824515      2025-08-06 10:21:05.866 user    t       \N      \N      \N      legituser123    \N      f       7XaGkFlWFKpcZ8pFWLYcbqMZDTqlkRxl        local   t       2025-08-06 10:21:05.839 2025-08-13 10:21:05.839 127.0.0.1       device123abc
54gM5e9w9Owr    test@example.com        Test    User    \N      \N      \N      free    inactive        0       2025-08-06 08:32:34.470859      2025-08-06 08:32:34.470859      user    t       2025-08-06 08:32:35.515 \N      \N      testuser123     \N      f       8SdQELcHImbMccLYlNd1lbg6S90uKZB0        local   f       \N      \N      \N      \N
di2O3E6bDYAH    john.doe@example.com    John    Doe     \N      \N      \N      free    inactive        0       2025-08-06 08:26:24.021979      2025-08-06 08:26:41.61  user    t       2025-08-06 08:32:42.22  hYRJVKY4aSUSeCmdnGYKyhOWZR-HTsWu        2025-08-06 09:26:41.61  johndoe123      \N      t       nuWOff3SeubRG2KTzK7hlSaHYirtPOMm        local   f       \N      \N      \N      \N
E1x23SjCzjEV    ratelimit1@example.com  Rate    Limit1  \N      \N      \N      free    active  0       2025-08-06 10:21:06.755501      2025-08-06 10:21:06.79  user    t       \N      \N      \N      ratelimit1      \N      f       4vuCmbjouvwQzZYVrBXAsQq3V0r-byRb        local   t       2025-08-06 10:21:06.767 2025-08-13 10:21:06.767 192.168.1.100   device1xyz
manual_1754457852879_osie0x     prophetclimate@yahoo.com        Climate Wiseman \N      \N      \N      premium active  0       2025-08-06 05:24:12.879 2025-08-06 08:36:40.740221      admin   t       2025-08-06 10:40:02.519 D0xhU1uhcNyYMO7ThYXMSzkIPDo9MEDs        2025-08-06 09:33:35.516 prophetclimate  \N      t       \N      local   f       \N      \N      \N      \N
\.


--
-- Name: book_categories book_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_pkey PRIMARY KEY (id);


--
-- Name: bookmarks bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_pkey PRIMARY KEY (id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_unique UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: free_trial_abuse_prevention free_trial_abuse_prevention_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.free_trial_abuse_prevention
    ADD CONSTRAINT free_trial_abuse_prevention_pkey PRIMARY KEY (id);


--
-- Name: reading_progress reading_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT reading_progress_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: signup_attempts signup_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.signup_attempts
    ADD CONSTRAINT signup_attempts_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: reading_progress unique_user_book; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT unique_user_book UNIQUE (user_id, book_id);


--
-- Name: user_selected_books user_selected_books_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_selected_books
    ADD CONSTRAINT user_selected_books_pkey PRIMARY KEY (id);


--
-- Name: user_subscription_cycles user_subscription_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_subscription_cycles
    ADD CONSTRAINT user_subscription_cycles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_device_fingerprint; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_device_fingerprint ON public.free_trial_abuse_prevention USING btree (device_fingerprint);


--
-- Name: idx_email_attempt; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_email_attempt ON public.signup_attempts USING btree (email, attempted_at);


--
-- Name: idx_email_domain; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_email_domain ON public.free_trial_abuse_prevention USING btree (email);


--
-- Name: idx_ip_attempt; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ip_attempt ON public.signup_attempts USING btree (registration_ip, attempted_at);


--
-- Name: idx_registration_ip; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_registration_ip ON public.free_trial_abuse_prevention USING btree (registration_ip);


--
-- Name: users_username_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX users_username_unique ON public.users USING btree (username) WHERE (username IS NOT NULL);


--
-- Name: book_categories book_categories_book_id_books_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_book_id_books_id_fk FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_categories book_categories_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: bookmarks bookmarks_book_id_books_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_book_id_books_id_fk FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: bookmarks bookmarks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: free_trial_abuse_prevention free_trial_abuse_prevention_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.free_trial_abuse_prevention
    ADD CONSTRAINT free_trial_abuse_prevention_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reading_progress reading_progress_book_id_books_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT reading_progress_book_id_books_id_fk FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: reading_progress reading_progress_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT reading_progress_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_selected_books user_selected_books_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_selected_books
    ADD CONSTRAINT user_selected_books_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: user_selected_books user_selected_books_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_selected_books
    ADD CONSTRAINT user_selected_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_subscription_cycles user_subscription_cycles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_subscription_cycles
    ADD CONSTRAINT user_subscription_cycles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

