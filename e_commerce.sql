--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: consumed_foods; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.consumed_foods (
    name character varying(100) NOT NULL,
    protein real DEFAULT 0.0,
    carbs real DEFAULT 0.0,
    calories real DEFAULT 0.0,
    portion real DEFAULT 0.0,
    userid integer,
    servings integer DEFAULT 1,
    id integer
);


ALTER TABLE public.consumed_foods OWNER TO neondb_owner;

--
-- Name: foods; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.foods (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    protein real DEFAULT 0.0,
    carbs real DEFAULT 0.0,
    calories real DEFAULT 0.0,
    portion real DEFAULT 0.0,
    userid integer
);


ALTER TABLE public.foods OWNER TO neondb_owner;

--
-- Name: foods_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.foods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.foods_id_seq OWNER TO neondb_owner;

--
-- Name: foods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.foods_id_seq OWNED BY public.foods.id;


--
-- Name: macro_goals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.macro_goals (
    protein_goal real DEFAULT 0.0,
    carbs_goal real DEFAULT 0.0,
    calories_goal real DEFAULT 0.0,
    userid integer
);


ALTER TABLE public.macro_goals OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(100) NOT NULL,
    username character varying(100) NOT NULL,
    protein_progress real DEFAULT 0.0,
    carbs_progress real DEFAULT 0.0,
    calories_progress real DEFAULT 0.0,
    height real DEFAULT 0.0,
    weight real DEFAULT 0.0,
    age integer DEFAULT 18 NOT NULL,
    stepper boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: foods id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.foods ALTER COLUMN id SET DEFAULT nextval('public.foods_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: consumed_foods; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.consumed_foods (name, protein, carbs, calories, portion, userid, servings, id) FROM stdin;
\.


--
-- Data for Name: foods; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.foods (id, name, protein, carbs, calories, portion, userid) FROM stdin;
\.


--
-- Data for Name: macro_goals; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.macro_goals (protein_goal, carbs_goal, calories_goal, userid) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password, username, protein_progress, carbs_progress, calories_progress, height, weight, age, stepper) FROM stdin;
\.


--
-- Name: foods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.foods_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: foods foods_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.foods
    ADD CONSTRAINT foods_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: consumed_foods consumed_foods_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.consumed_foods
    ADD CONSTRAINT consumed_foods_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id);


--
-- Name: consumed_foods foodfk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.consumed_foods
    ADD CONSTRAINT foodfk FOREIGN KEY (id) REFERENCES public.foods(id);


--
-- Name: foods foods_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.foods
    ADD CONSTRAINT foods_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id);


--
-- Name: macro_goals macro_goals_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.macro_goals
    ADD CONSTRAINT macro_goals_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

