BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE student_status AS ENUM ('active', 'disabled');
CREATE TYPE material_type AS ENUM ('pdf', 'audio', 'video', 'link');
CREATE TYPE skill_code AS ENUM (
  'vocabulary', 'grammar', 'pronunciation', 'listening',
  'reading', 'speaking', 'writing'
);

CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code citext NOT NULL UNIQUE,
  name text NOT NULL CHECK (btrim(name) <> ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  student_code citext NOT NULL,
  password_hash text NOT NULL CHECK (btrim(password_hash) <> ''),
  full_name text NOT NULL CHECK (btrim(full_name) <> ''),
  nickname text,
  status student_status NOT NULL DEFAULT 'active',
  password_changed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, student_code),
  UNIQUE (id, school_id)
);

CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  code citext NOT NULL,
  name text NOT NULL CHECK (btrim(name) <> ''),
  subject text NOT NULL CHECK (btrim(subject) <> ''),
  starts_on date,
  ends_on date,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on),
  UNIQUE (school_id, code),
  UNIQUE (id, school_id)
);

CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  class_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ended_at IS NULL OR ended_at >= enrolled_at),
  FOREIGN KEY (student_id, school_id) REFERENCES students(id, school_id) ON DELETE CASCADE,
  FOREIGN KEY (class_id, school_id) REFERENCES classes(id, school_id) ON DELETE CASCADE,
  UNIQUE (student_id, class_id),
  UNIQUE (id, school_id, class_id)
);

CREATE TABLE units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  class_id uuid NOT NULL,
  name text NOT NULL CHECK (btrim(name) <> ''),
  unit_order integer NOT NULL CHECK (unit_order > 0),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (class_id, school_id) REFERENCES classes(id, school_id) ON DELETE CASCADE,
  UNIQUE (class_id, unit_order),
  UNIQUE (id, school_id, class_id)
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  class_id uuid NOT NULL,
  enrollment_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  tested_at timestamptz,
  total_score numeric(10,2),
  total_max_score numeric(10,2),
  total_percentage numeric(5,2),
  overall_comment text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (total_score IS NULL OR total_score >= 0),
  CHECK (total_max_score IS NULL OR total_max_score > 0),
  CHECK (total_score IS NULL OR total_max_score IS NULL OR total_score <= total_max_score),
  CHECK (total_percentage IS NULL OR total_percentage BETWEEN 0 AND 100),
  FOREIGN KEY (enrollment_id, school_id, class_id)
    REFERENCES enrollments(id, school_id, class_id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id, school_id, class_id)
    REFERENCES units(id, school_id, class_id) ON DELETE CASCADE,
  UNIQUE (enrollment_id, unit_id),
  UNIQUE (id, school_id)
);

CREATE TABLE report_skill_scores (
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  skill skill_code NOT NULL,
  score numeric(10,2),
  max_score numeric(10,2),
  percentage numeric(5,2),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (score IS NULL OR score >= 0),
  CHECK (max_score IS NULL OR max_score > 0),
  CHECK (score IS NULL OR max_score IS NULL OR score <= max_score),
  CHECK (percentage IS NULL OR percentage BETWEEN 0 AND 100),
  PRIMARY KEY (report_id, skill)
);

CREATE TABLE report_advice (
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  advice_order smallint NOT NULL CHECK (advice_order > 0),
  content text NOT NULL CHECK (btrim(content) <> ''),
  PRIMARY KEY (report_id, advice_order)
);

CREATE TABLE materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  class_id uuid NOT NULL,
  unit_id uuid,
  title text NOT NULL CHECK (btrim(title) <> ''),
  type material_type NOT NULL,
  object_key text NOT NULL CHECK (btrim(object_key) <> ''),
  external_url text,
  size_bytes bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (class_id, school_id) REFERENCES classes(id, school_id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id, school_id, class_id) REFERENCES units(id, school_id, class_id) ON DELETE CASCADE,
  UNIQUE (school_id, object_key)
);

CREATE TABLE one_time_login_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  code_hash bytea NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at),
  CHECK (used_at IS NULL OR used_at >= created_at)
);

CREATE INDEX students_school_status_idx ON students (school_id, status);
CREATE INDEX enrollments_student_active_idx ON enrollments (student_id, is_active, enrolled_at DESC);
CREATE INDEX enrollments_class_idx ON enrollments (class_id, student_id);
CREATE INDEX units_class_order_idx ON units (class_id, unit_order);
CREATE INDEX reports_enrollment_published_idx ON reports (enrollment_id, published_at, unit_id);
CREATE INDEX reports_unit_idx ON reports (unit_id, enrollment_id);
CREATE INDEX materials_class_published_idx ON materials (class_id, published_at DESC);
CREATE INDEX materials_unit_idx ON materials (unit_id) WHERE unit_id IS NOT NULL;
CREATE INDEX login_codes_student_idx ON one_time_login_codes (student_id, created_at DESC);
CREATE INDEX login_codes_expiry_idx ON one_time_login_codes (expires_at) WHERE used_at IS NULL;

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER schools_set_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER students_set_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER classes_set_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER enrollments_set_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER units_set_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER reports_set_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER report_skill_scores_set_updated_at BEFORE UPDATE ON report_skill_scores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER materials_set_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
