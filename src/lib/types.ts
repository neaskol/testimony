// ============================================================
// Database types
// ============================================================

export type Role = "superadmin" | "admin" | "translator";

export type LanguageCode = "mg" | "fr";

export type ColorTag = "blue" | "green" | "red" | "yellow" | "purple";

export type TestimonyStatus =
  | "received"
  | "in_translation"
  | "translated"
  | "planned"
  | "read";

export type ReadingStatus = "read" | "skipped";

// ============================================================
// Table row types
// ============================================================

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  owned_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Witness {
  id: string;
  created_by: string;
  full_name: string;
  phone: string | null;
  city: string | null;
  language_preference: LanguageCode;
  color_tag: ColorTag | null;
  label: string | null;
  private_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Testimony {
  id: string;
  owned_by: string;
  witness_id: string | null;
  content: string | null;
  audio_url: string | null;
  source_language: LanguageCode;
  status: TestimonyStatus;
  tags: string[];
  summary: string | null;
  private_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestimonyShare {
  id: string;
  testimony_id: string;
  shared_by: string;
  shared_with: string;
  created_at: string;
}

export interface Translation {
  id: string;
  testimony_id: string;
  translator_id: string;
  content: string;
  target_language: LanguageCode;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  testimony_id: string;
  translator_id: string;
  assigned_by: string;
  assigned_at: string;
}

export interface Service {
  id: string;
  created_by: string;
  service_date: string;
  title: string;
  subject: string | null;
  inspiration: string | null;
  scriptures: string[];
  created_at: string;
  updated_at: string;
}

export interface ReadingPlan {
  id: string;
  service_id: string;
  created_by: string;
  testimony_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ReadingPlanAssignment {
  id: string;
  plan_id: string;
  translator_id: string;
}

export interface ReadingOccasion {
  id: string;
  testimony_id: string;
  service_id: string;
  plan_id: string;
  read_by: string;
  status: ReadingStatus;
  read_at: string;
}

// ============================================================
// Extended types (with joins)
// ============================================================

export interface TestimonyWithWitness extends Testimony {
  witness: Pick<Witness, "id" | "full_name" | "language_preference"> | null;
}

export interface TestimonyWithTranslation extends TestimonyWithWitness {
  translations: Translation[];
}

export interface AssignmentWithTestimony extends Assignment {
  testimony: TestimonyWithWitness;
}

export interface ReadingPlanWithService extends ReadingPlan {
  service: Service;
}

// ============================================================
// Mode Réunion types
// ============================================================

export interface ReunionTestimony {
  id: string;
  witnessName: string;
  content: string;
  translatedContent?: string;
  status: "pending" | "read" | "skipped";
}

export interface ReunionState {
  planId: string;
  currentIndex: number;
  testimonies: ReunionTestimony[];
  isDarkMode: boolean;
  isActive: boolean;
}

// ============================================================
// Witness detail types
// ============================================================

export interface WitnessTestimonyWithReading {
  id: string;
  content: string | null;
  summary: string | null;
  source_language: LanguageCode;
  status: TestimonyStatus;
  created_at: string;
  reading_occasions: {
    id: string;
    status: ReadingStatus;
    read_at: string;
    service: Pick<Service, "id" | "title" | "service_date"> | null;
  }[];
}

export interface WitnessStats {
  total: number;
  read: number;
  pending: number;
  lastTestimonyDate: string | null;
}

// ============================================================
// Server Action return types
// ============================================================

export type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: string };
