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
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.audit_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    action character varying NOT NULL,
    resource character varying,
    resource_id character varying,
    details jsonb,
    ip_address character varying,
    user_agent text,
    severity character varying DEFAULT 'info'::character varying NOT NULL,
    status character varying DEFAULT 'success'::character varying NOT NULL,
    session_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO neondb_owner;

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
-- Name: book_reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.book_reviews (
    id character varying(255) DEFAULT ((('review_'::text || EXTRACT(epoch FROM now())) || '_'::text) || substr(md5((random())::text), 1, 8)) NOT NULL,
    user_id character varying(255) NOT NULL,
    book_id character varying(255) NOT NULL,
    rating integer NOT NULL,
    review_title character varying(200),
    review_text text,
    is_verified_purchase boolean DEFAULT false,
    helpful_votes integer DEFAULT 0,
    is_approved boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT book_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.book_reviews OWNER TO neondb_owner;

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
    updated_at timestamp without time zone DEFAULT now(),
    long_description text,
    author_bio text,
    publisher character varying(255),
    published_year integer,
    page_count integer,
    language character varying(50) DEFAULT 'English'::character varying,
    isbn character varying(20),
    genre character varying(100),
    table_of_contents text[],
    key_takeaways text[],
    learning_objectives text[],
    difficulty_level character varying(20) DEFAULT 'Beginner'::character varying,
    estimated_read_time integer,
    tags character varying(50)[],
    awards text[],
    total_reviews integer DEFAULT 0,
    target_audience text,
    preview_page_count integer DEFAULT 5,
    storage_path text,
    sha256 character varying(64),
    file_size integer,
    chunk_size integer DEFAULT 1048576,
    chunk_count integer DEFAULT 0,
    encryption_key_id character varying(255)
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
-- Name: challenge_activities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.challenge_activities (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    challenge_id character varying NOT NULL,
    user_id character varying NOT NULL,
    activity_type character varying NOT NULL,
    message text,
    progress_value integer,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.challenge_activities OWNER TO neondb_owner;

--
-- Name: challenge_comments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.challenge_comments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    challenge_id character varying NOT NULL,
    user_id character varying NOT NULL,
    content text NOT NULL,
    parent_id character varying,
    likes integer DEFAULT 0,
    is_edited boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.challenge_comments OWNER TO neondb_owner;

--
-- Name: challenge_participants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.challenge_participants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    challenge_id character varying NOT NULL,
    user_id character varying NOT NULL,
    joined_at timestamp without time zone DEFAULT now(),
    progress integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    completed_at timestamp without time zone,
    rank integer,
    notes text
);


ALTER TABLE public.challenge_participants OWNER TO neondb_owner;

--
-- Name: challenges; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.challenges (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    description text,
    challenge_type character varying NOT NULL,
    target_value integer,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    creator_id character varying NOT NULL,
    is_active boolean DEFAULT true,
    participant_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.challenges OWNER TO neondb_owner;

--
-- Name: devices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.devices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    name text NOT NULL,
    public_key text NOT NULL,
    device_fingerprint character varying(255),
    user_agent text,
    last_active_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.devices OWNER TO neondb_owner;

--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    email character varying NOT NULL,
    email_type character varying NOT NULL,
    subject text NOT NULL,
    status character varying NOT NULL,
    error_message text,
    sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_logs OWNER TO neondb_owner;

--
-- Name: email_preferences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_preferences (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    email character varying NOT NULL,
    unsubscribe_token character varying NOT NULL,
    marketing_emails boolean DEFAULT true,
    trial_reminders boolean DEFAULT true,
    subscription_updates boolean DEFAULT true,
    is_unsubscribed_all boolean DEFAULT false,
    unsubscribed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.email_preferences OWNER TO neondb_owner;

--
-- Name: feedback; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feedback (
    id text DEFAULT gen_random_uuid() NOT NULL,
    user_id text,
    type text NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    priority text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    url text NOT NULL,
    user_agent text NOT NULL,
    device_info jsonb NOT NULL,
    screenshot text,
    admin_response text,
    admin_response_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    admin_response_by text,
    is_public boolean DEFAULT true,
    upvotes integer DEFAULT 0,
    tags text[],
    resolved_by text,
    resolved_at timestamp without time zone,
    CONSTRAINT feedback_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT feedback_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text]))),
    CONSTRAINT feedback_type_check CHECK ((type = ANY (ARRAY['bug'::text, 'feedback'::text, 'suggestion'::text, 'compliment'::text])))
);


ALTER TABLE public.feedback OWNER TO neondb_owner;

--
-- Name: feedback_comments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feedback_comments (
    id text DEFAULT gen_random_uuid() NOT NULL,
    feedback_id text NOT NULL,
    user_id text,
    comment text NOT NULL,
    is_internal boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.feedback_comments OWNER TO neondb_owner;

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
-- Name: health_alert_state; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_alert_state (
    id integer NOT NULL,
    alert_type character varying NOT NULL,
    status character varying NOT NULL,
    last_sent_at timestamp without time zone NOT NULL,
    cooldown_minutes integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.health_alert_state OWNER TO neondb_owner;

--
-- Name: health_alert_state_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.health_alert_state_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.health_alert_state_id_seq OWNER TO neondb_owner;

--
-- Name: health_alert_state_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.health_alert_state_id_seq OWNED BY public.health_alert_state.id;


--
-- Name: health_check_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_check_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    run_id character varying NOT NULL,
    name character varying NOT NULL,
    status character varying NOT NULL,
    duration_ms integer DEFAULT 0 NOT NULL,
    message text,
    meta_json jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.health_check_items OWNER TO neondb_owner;

--
-- Name: health_check_runs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.health_check_runs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    started_at timestamp with time zone DEFAULT now(),
    finished_at timestamp with time zone,
    overall_status character varying NOT NULL,
    summary_json jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.health_check_runs OWNER TO neondb_owner;

--
-- Name: licenses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.licenses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    loan_id character varying NOT NULL,
    device_id character varying NOT NULL,
    user_id character varying NOT NULL,
    book_id character varying NOT NULL,
    key_wrapped text NOT NULL,
    offline_expires_at timestamp with time zone NOT NULL,
    policy jsonb NOT NULL,
    signature text NOT NULL,
    server_time timestamp with time zone DEFAULT now(),
    revoked boolean DEFAULT false,
    revoked_at timestamp with time zone,
    last_renewed_at timestamp with time zone,
    renewal_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.licenses OWNER TO neondb_owner;

--
-- Name: loans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.loans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    book_id character varying NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    loan_type character varying DEFAULT 'subscription'::character varying NOT NULL,
    started_at timestamp with time zone DEFAULT now(),
    returned_at timestamp with time zone,
    revoked_at timestamp with time zone,
    revoked_by character varying,
    revoke_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.loans OWNER TO neondb_owner;

--
-- Name: reading_challenges; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reading_challenges (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying NOT NULL,
    description text,
    type character varying NOT NULL,
    target_value integer NOT NULL,
    duration character varying NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    is_public boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_by_id character varying NOT NULL,
    max_participants integer,
    rules text[],
    tags character varying[],
    difficulty character varying DEFAULT 'medium'::character varying,
    prize text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reading_challenges OWNER TO neondb_owner;

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
-- Name: review_helpful_votes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.review_helpful_votes (
    id character varying(255) DEFAULT ((('vote_'::text || EXTRACT(epoch FROM now())) || '_'::text) || substr(md5((random())::text), 1, 8)) NOT NULL,
    review_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    is_helpful boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.review_helpful_votes OWNER TO neondb_owner;

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
-- Name: system_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.system_config (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    key character varying NOT NULL,
    value text NOT NULL,
    description text,
    data_type character varying DEFAULT 'string'::character varying NOT NULL,
    is_editable boolean DEFAULT true,
    category character varying DEFAULT 'general'::character varying,
    updated_by character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_config OWNER TO neondb_owner;

--
-- Name: user_copy_tracking; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_copy_tracking (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    book_id character varying NOT NULL,
    total_characters_copied integer DEFAULT 0,
    total_book_characters integer NOT NULL,
    copy_percentage numeric(5,2) DEFAULT 0.00,
    max_copy_percentage numeric(5,2) DEFAULT 40.00,
    last_copy_at timestamp without time zone,
    is_limit_reached boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_copy_tracking OWNER TO neondb_owner;

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
-- Name: health_alert_state id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_alert_state ALTER COLUMN id SET DEFAULT nextval('public.health_alert_state_id_seq'::regclass);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: book_categories book_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.book_categories
    ADD CONSTRAINT book_categories_pkey PRIMARY KEY (id);


--
-- Name: book_reviews book_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.book_reviews
    ADD CONSTRAINT book_reviews_pkey PRIMARY KEY (id);


--
-- Name: book_reviews book_reviews_user_id_book_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.book_reviews
    ADD CONSTRAINT book_reviews_user_id_book_id_key UNIQUE (user_id, book_id);


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
-- Name: challenge_activities challenge_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.challenge_activities
    ADD CONSTRAINT challenge_activities_pkey PRIMARY KEY (id);


--
-- Name: challenge_comments challenge_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.challenge_comments
    ADD CONSTRAINT challenge_comments_pkey PRIMARY KEY (id);


--
-- Name: challenge_participants challenge_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_pkey PRIMARY KEY (id);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: email_preferences email_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_preferences
    ADD CONSTRAINT email_preferences_pkey PRIMARY KEY (id);


--
-- Name: email_preferences email_preferences_unsubscribe_token_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_preferences
    ADD CONSTRAINT email_preferences_unsubscribe_token_key UNIQUE (unsubscribe_token);


--
-- Name: feedback_comments feedback_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback_comments
    ADD CONSTRAINT feedback_comments_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: free_trial_abuse_prevention free_trial_abuse_prevention_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.free_trial_abuse_prevention
    ADD CONSTRAINT free_trial_abuse_prevention_pkey PRIMARY KEY (id);


--
-- Name: health_alert_state health_alert_state_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_alert_state
    ADD CONSTRAINT health_alert_state_pkey PRIMARY KEY (id);


--
-- Name: health_check_items health_check_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_check_items
    ADD CONSTRAINT health_check_items_pkey PRIMARY KEY (id);


--
-- Name: health_check_runs health_check_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_check_runs
    ADD CONSTRAINT health_check_runs_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- Name: reading_challenges reading_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reading_challenges
    ADD CONSTRAINT reading_challenges_pkey PRIMARY KEY (id);


--
-- Name: reading_progress reading_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT reading_progress_pkey PRIMARY KEY (id);


--
-- Name: review_helpful_votes review_helpful_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_pkey PRIMARY KEY (id);


--
-- Name: review_helpful_votes review_helpful_votes_review_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_review_id_user_id_key UNIQUE (review_id, user_id);


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
-- Name: system_config system_config_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_key_key UNIQUE (key);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (id);


--
-- Name: reading_progress unique_user_book; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reading_progress
    ADD CONSTRAINT unique_user_book UNIQUE (user_id, book_id);


--
-- Name: user_copy_tracking unique_user_book_copy; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_copy_tracking
    ADD CONSTRAINT unique_user_book_copy UNIQUE (user_id, book_id);


--
-- Name: user_copy_tracking user_copy_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_copy_tracking
    ADD CONSTRAINT user_copy_tracking_pkey PRIMARY KEY (id);


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
-- Name: idx_challenge_activity; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_challenge_activity ON public.challenge_activities USING btree (challenge_id, created_at);


--
-- Name: idx_challenge_comments; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_challenge_comments ON public.challenge_comments USING btree (challenge_id, created_at);


--
-- Name: idx_challenge_creator; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_challenge_creator ON public.reading_challenges USING btree (created_by_id);


--
-- Name: idx_challenge_dates; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_challenge_dates ON public.reading_challenges USING btree (start_date, end_date);


--
-- Name: idx_challenge_progress; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_challenge_progress ON public.challenge_participants USING btree (challenge_id, progress);


--
-- Name: idx_challenge_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_challenge_status ON public.reading_challenges USING btree (is_active, is_public);


--
-- Name: idx_challenge_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_challenge_type ON public.reading_challenges USING btree (type);


--
-- Name: idx_challenge_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_challenge_user ON public.challenge_participants USING btree (challenge_id, user_id);


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
-- Name: idx_email_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_email_status ON public.email_logs USING btree (status);


--
-- Name: idx_ip_attempt; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ip_attempt ON public.signup_attempts USING btree (registration_ip, attempted_at);


--
-- Name: idx_parent_comment; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_parent_comment ON public.challenge_comments USING btree (parent_id);


--
-- Name: idx_registration_ip; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_registration_ip ON public.free_trial_abuse_prevention USING btree (registration_ip);


--
-- Name: idx_sent_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sent_at ON public.email_logs USING btree (sent_at);


--
-- Name: idx_unsubscribe_token; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_unsubscribe_token ON public.email_preferences USING btree (unsubscribe_token);


--
-- Name: idx_user_activity; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_activity ON public.challenge_activities USING btree (user_id, created_at);


--
-- Name: idx_user_challenges; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_challenges ON public.challenge_participants USING btree (user_id);


--
-- Name: idx_user_email_prefs; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_email_prefs ON public.email_preferences USING btree (user_id, email);


--
-- Name: idx_user_email_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_email_type ON public.email_logs USING btree (user_id, email_type);


--
-- Name: sessions_expire_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX sessions_expire_idx ON public.sessions USING btree (expire);


--
-- Name: users_username_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX users_username_unique ON public.users USING btree (username) WHERE (username IS NOT NULL);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


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
-- Name: book_reviews book_reviews_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.book_reviews
    ADD CONSTRAINT book_reviews_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- Name: book_reviews book_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.book_reviews
    ADD CONSTRAINT book_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: challenge_activities challenge_activities_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.challenge_activities
    ADD CONSTRAINT challenge_activities_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.reading_challenges(id) ON DELETE CASCADE;


--
-- Name: challenge_activities challenge_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.challenge_activities
    ADD CONSTRAINT challenge_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: challenge_comments challenge_comments_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.challenge_comments
    ADD CONSTRAINT challenge_comments_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.reading_challenges(id) ON DELETE CASCADE;


--
-- Name: challenge_comments challenge_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.challenge_comments
    ADD CONSTRAINT challenge_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: challenge_participants challenge_participants_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.reading_challenges(id) ON DELETE CASCADE;


--
-- Name: challenge_participants challenge_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.challenge_participants
    ADD CONSTRAINT challenge_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: challenges challenges_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: devices devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: email_logs email_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: email_preferences email_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_preferences
    ADD CONSTRAINT email_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feedback feedback_admin_response_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_admin_response_by_fkey FOREIGN KEY (admin_response_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: feedback_comments feedback_comments_feedback_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback_comments
    ADD CONSTRAINT feedback_comments_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.feedback(id) ON DELETE CASCADE;


--
-- Name: feedback_comments feedback_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback_comments
    ADD CONSTRAINT feedback_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: feedback feedback_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: feedback feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: free_trial_abuse_prevention free_trial_abuse_prevention_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.free_trial_abuse_prevention
    ADD CONSTRAINT free_trial_abuse_prevention_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: health_check_items health_check_items_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.health_check_items
    ADD CONSTRAINT health_check_items_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.health_check_runs(id) ON DELETE CASCADE;


--
-- Name: licenses licenses_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: licenses licenses_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id);


--
-- Name: licenses licenses_loan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id);


--
-- Name: licenses licenses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: loans loans_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id);


--
-- Name: loans loans_revoked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES public.users(id);


--
-- Name: loans loans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reading_challenges reading_challenges_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reading_challenges
    ADD CONSTRAINT reading_challenges_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


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
-- Name: review_helpful_votes review_helpful_votes_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.book_reviews(id) ON DELETE CASCADE;


--
-- Name: review_helpful_votes review_helpful_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: system_config system_config_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


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

