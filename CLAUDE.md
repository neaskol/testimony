# TémoinApp — Architecture & Plan d'implémentation

## Vue d'ensemble

Application web de gestion de témoignages pour une église. Permet aux pasteurs (admins) de collecter, organiser et planifier la lecture publique de témoignages lors des cultes, avec l'aide de traducteurs assignés.

**Fonctionnalité critique** : le Mode Culte — interface mobile optimisée pour la lecture publique en temps réel pendant un service religieux.

---

## Stack technique

| Couche         | Technologie                          |
|----------------|--------------------------------------|
| Framework      | Next.js 14 (App Router)              |
| Auth           | Supabase Auth (email/password)       |
| Base de données| Supabase PostgreSQL                  |
| Storage        | Supabase Storage (fichiers audio)    |
| Styling        | TailwindCSS + shadcn/ui              |
| Transcription  | OpenAI Whisper API (optionnel)       |
| Déploiement    | Vercel                               |
| Langue UI      | Français uniquement                  |

---

## Décisions techniques

### 1. Server Actions comme couche métier principale
- Toute la logique passe par des Server Actions Next.js (`"use server"`)
- Le client Supabase server-side (`createServerClient` de `@supabase/ssr`) gère auth + requêtes
- RLS activé comme filet de sécurité (défense en profondeur), mais l'autorisation est vérifiée dans les Server Actions
- Aucun appel Supabase direct depuis le client (sauf auth login/logout)

**Pourquoi** : sécurité renforcée, logique centralisée, testabilité, pas de fuite de clés API côté client.

### 2. Mode Culte : localStorage + state local
- Position de scroll sauvegardée dans `localStorage` (clé : `culte_scroll_[plan_id]`)
- Progression (index courant, statuts) en state React local
- Marquage "Lu" via Server Action uniquement au passage au témoignage suivant en mode culte actif
- Page Visibility API pour restaurer la position après veille du téléphone
- Pas de Supabase Realtime (overkill pour un seul lecteur actif)

**Pourquoi** : simple, fiable, fonctionne même avec une connexion instable.

### 3. Invitation par admin uniquement
- Pas d'inscription publique
- L'admin crée un compte traducteur via Supabase Auth Admin API (server-side)
- Le traducteur reçoit un email d'invitation Supabase pour définir son mot de passe
- Le super-admin initial est créé via un seed SQL

**Pourquoi** : sécurité, pas de spam, contrôle total des accès.

### 4. Middleware Next.js pour le routage par rôle
- Middleware vérifie la session Supabase sur chaque requête
- Redirige vers `/login` si non authentifié
- Redirige vers le bon dashboard selon le rôle (`/admin/*` ou `/translator/*`)
- Refuse l'accès si le rôle ne correspond pas au préfixe de route

### 5. Design Swiss/Editorial
- Typographie : serif pour les titres (Playfair Display), sans-serif pour le corps (Inter)
- Palette : noir `#0A0A0A`, blanc `#FAFAFA`, gris ardoise `#64748B`, accent doré `#B8860B`
- Beaucoup d'espace blanc, grille rigoureuse
- Pas d'emoji, pas de gradients, pas de couleurs AI slop
- Icônes : Lucide (fourni par shadcn/ui)
- Contraste WCAG AA minimum

---

## Schéma de base de données

### Table `profiles`
Extension de `auth.users` de Supabase.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'translator')),
  owned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- owned_by est NULL pour les admins/superadmins
-- owned_by = admin_id pour les traducteurs
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_owned_by ON public.profiles(owned_by);
```

### Table `witnesses` (Témoins)

```sql
CREATE TABLE public.witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  language_preference TEXT NOT NULL DEFAULT 'fr' CHECK (language_preference IN ('mg', 'fr')),
  color_tag TEXT CHECK (color_tag IN ('blue', 'green', 'red', 'yellow', 'purple')),
  label TEXT,
  private_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_witnesses_created_by ON public.witnesses(created_by);
```

### Table `testimonies` (Témoignages)

```sql
CREATE TABLE public.testimonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  witness_id UUID REFERENCES public.witnesses(id) ON DELETE SET NULL,
  content TEXT,
  audio_url TEXT,
  source_language TEXT NOT NULL DEFAULT 'fr' CHECK (source_language IN ('mg', 'fr')),
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'in_translation', 'translated', 'planned', 'read')),
  tags TEXT[] DEFAULT '{}',
  private_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_testimonies_owned_by ON public.testimonies(owned_by);
CREATE INDEX idx_testimonies_witness_id ON public.testimonies(witness_id);
CREATE INDEX idx_testimonies_status ON public.testimonies(status);
```

### Table `testimony_shares` (Partage inter-admins)

```sql
CREATE TABLE public.testimony_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(testimony_id, shared_with)
);

CREATE INDEX idx_testimony_shares_shared_with ON public.testimony_shares(shared_with);
```

### Table `translations`

```sql
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  translator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  target_language TEXT NOT NULL CHECK (target_language IN ('mg', 'fr')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_translations_testimony_id ON public.translations(testimony_id);
CREATE INDEX idx_translations_translator_id ON public.translations(translator_id);
```

### Table `assignments` (Assignation témoignage → traducteur)

```sql
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  translator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(testimony_id, translator_id)
);

CREATE INDEX idx_assignments_translator_id ON public.assignments(translator_id);
```

### Table `services` (Fiches Culte)

```sql
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  inspiration TEXT,
  scriptures TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_created_by ON public.services(created_by);
CREATE INDEX idx_services_service_date ON public.services(service_date);
```

### Table `reading_plans` (Plannings de lecture)

```sql
CREATE TABLE public.reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  testimony_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reading_plans_service_id ON public.reading_plans(service_id);
CREATE INDEX idx_reading_plans_created_by ON public.reading_plans(created_by);
```

### Table `reading_plan_assignments` (Traducteur assigné à un planning)

```sql
CREATE TABLE public.reading_plan_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  translator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(plan_id, translator_id)
);

CREATE INDEX idx_rpa_translator_id ON public.reading_plan_assignments(translator_id);
```

### Table `reading_occasions` (Historique des lectures publiques)

```sql
CREATE TABLE public.reading_occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  read_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('read', 'skipped')),
  read_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reading_occasions_testimony_id ON public.reading_occasions(testimony_id);
CREATE INDEX idx_reading_occasions_service_id ON public.reading_occasions(service_id);
CREATE INDEX idx_reading_occasions_plan_id ON public.reading_occasions(plan_id);
```

### Trigger : sync profile on auth.users creation

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'translator')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Trigger : updated_at automatique

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer sur chaque table avec updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.witnesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.testimonies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reading_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

## Politiques RLS

### Principe général
- Chaque table a RLS activé (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- Le super-admin bypasse via un check sur `profiles.role = 'superadmin'`
- Les admins ne voient que les lignes où `owned_by`/`created_by` = leur ID, ou partagées via `testimony_shares`
- Les traducteurs ne voient que les lignes liées à leurs `assignments` ou `reading_plan_assignments`

### Helper functions

```sql
-- Récupère le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vérifie si l'utilisateur est super-admin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Récupère le owned_by du traducteur (son admin)
CREATE OR REPLACE FUNCTION public.get_translator_admin()
RETURNS UUID AS $$
  SELECT owned_by FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Policies par table

**profiles**
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Superadmin voit tout
CREATE POLICY "superadmin_all" ON public.profiles
  FOR ALL USING (public.is_superadmin());

-- Admin voit son profil + ses traducteurs
CREATE POLICY "admin_select" ON public.profiles
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    AND (id = auth.uid() OR owned_by = auth.uid())
  );

-- Traducteur voit son propre profil
CREATE POLICY "translator_select" ON public.profiles
  FOR SELECT USING (
    public.get_user_role() = 'translator' AND id = auth.uid()
  );
```

**witnesses**
```sql
ALTER TABLE public.witnesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.witnesses
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.witnesses
  FOR ALL USING (
    public.get_user_role() = 'admin' AND created_by = auth.uid()
  );

-- Traducteurs : lecture seule des témoins liés à leurs témoignages assignés
CREATE POLICY "translator_read" ON public.witnesses
  FOR SELECT USING (
    public.get_user_role() = 'translator'
    AND id IN (
      SELECT t.witness_id FROM public.testimonies t
      INNER JOIN public.assignments a ON a.testimony_id = t.id
      WHERE a.translator_id = auth.uid()
    )
  );
```

**testimonies**
```sql
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.testimonies
  FOR ALL USING (public.is_superadmin());

-- Admin : ses propres témoignages + ceux partagés avec lui
CREATE POLICY "admin_select" ON public.testimonies
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    AND (
      owned_by = auth.uid()
      OR id IN (
        SELECT testimony_id FROM public.testimony_shares
        WHERE shared_with = auth.uid()
      )
    )
  );

CREATE POLICY "admin_insert" ON public.testimonies
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'admin' AND owned_by = auth.uid()
  );

CREATE POLICY "admin_update" ON public.testimonies
  FOR UPDATE USING (
    public.get_user_role() = 'admin' AND owned_by = auth.uid()
  );

CREATE POLICY "admin_delete" ON public.testimonies
  FOR DELETE USING (
    public.get_user_role() = 'admin' AND owned_by = auth.uid()
  );

-- Traducteur : lecture seule des témoignages assignés
CREATE POLICY "translator_read" ON public.testimonies
  FOR SELECT USING (
    public.get_user_role() = 'translator'
    AND id IN (
      SELECT testimony_id FROM public.assignments
      WHERE translator_id = auth.uid()
    )
  );
```

**testimony_shares**
```sql
ALTER TABLE public.testimony_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.testimony_shares
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.testimony_shares
  FOR ALL USING (
    public.get_user_role() = 'admin'
    AND (shared_by = auth.uid() OR shared_with = auth.uid())
  );
```

**translations**
```sql
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.translations
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_read" ON public.translations
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    AND testimony_id IN (
      SELECT id FROM public.testimonies WHERE owned_by = auth.uid()
    )
  );

-- Traducteur : CRUD sur ses propres traductions (pour les témoignages assignés)
CREATE POLICY "translator_own" ON public.translations
  FOR ALL USING (
    public.get_user_role() = 'translator'
    AND translator_id = auth.uid()
  );
```

**assignments**
```sql
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.assignments
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.assignments
  FOR ALL USING (
    public.get_user_role() = 'admin' AND assigned_by = auth.uid()
  );

CREATE POLICY "translator_read" ON public.assignments
  FOR SELECT USING (
    public.get_user_role() = 'translator' AND translator_id = auth.uid()
  );
```

**services**
```sql
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.services
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.services
  FOR ALL USING (
    public.get_user_role() = 'admin' AND created_by = auth.uid()
  );

-- Traducteurs : lecture seule des services liés à leurs plannings
CREATE POLICY "translator_read" ON public.services
  FOR SELECT USING (
    public.get_user_role() = 'translator'
    AND id IN (
      SELECT rp.service_id FROM public.reading_plans rp
      INNER JOIN public.reading_plan_assignments rpa ON rpa.plan_id = rp.id
      WHERE rpa.translator_id = auth.uid()
    )
  );
```

**reading_plans**
```sql
ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.reading_plans
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.reading_plans
  FOR ALL USING (
    public.get_user_role() = 'admin' AND created_by = auth.uid()
  );

CREATE POLICY "translator_read" ON public.reading_plans
  FOR SELECT USING (
    public.get_user_role() = 'translator'
    AND id IN (
      SELECT plan_id FROM public.reading_plan_assignments
      WHERE translator_id = auth.uid()
    )
  );
```

**reading_plan_assignments**
```sql
ALTER TABLE public.reading_plan_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.reading_plan_assignments
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.reading_plan_assignments
  FOR ALL USING (
    public.get_user_role() = 'admin'
    AND plan_id IN (
      SELECT id FROM public.reading_plans WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "translator_read" ON public.reading_plan_assignments
  FOR SELECT USING (
    public.get_user_role() = 'translator' AND translator_id = auth.uid()
  );
```

**reading_occasions**
```sql
ALTER TABLE public.reading_occasions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.reading_occasions
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_read" ON public.reading_occasions
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    AND service_id IN (
      SELECT id FROM public.services WHERE created_by = auth.uid()
    )
  );

-- Traducteur : peut créer (marquage lu) et lire ses propres lectures
CREATE POLICY "translator_own" ON public.reading_occasions
  FOR ALL USING (
    public.get_user_role() = 'translator' AND read_by = auth.uid()
  );
```

### Storage : bucket `audio`

```sql
-- Bucket pour les fichiers audio de témoignages
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', false);

-- Admin upload
CREATE POLICY "admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio'
    AND (public.get_user_role() IN ('admin', 'superadmin'))
  );

-- Admin + traducteur assigné peuvent lire
CREATE POLICY "authenticated_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audio'
    AND auth.role() = 'authenticated'
  );

-- Admin peut supprimer ses propres fichiers
CREATE POLICY "admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'audio'
    AND (public.get_user_role() IN ('admin', 'superadmin'))
  );
```

---

## Rôles & Permissions (résumé)

| Action                          | Superadmin | Admin              | Traducteur          |
|---------------------------------|------------|--------------------|---------------------|
| Voir tous les admins            | oui        | non                | non                 |
| Créer un admin                  | oui        | non                | non                 |
| Créer un traducteur             | oui        | oui (lié à lui)    | non                 |
| CRUD témoins                    | oui        | oui (les siens)    | lecture seule        |
| CRUD témoignages                | oui        | oui (les siens)    | lecture seule        |
| Partager un témoignage          | oui        | oui                | non                 |
| CRUD traductions                | oui        | lecture seule      | oui (les siennes)   |
| CRUD fiches culte (services)    | oui        | oui (les siens)    | lecture seule        |
| CRUD plannings                  | oui        | oui (les siens)    | lecture seule        |
| Assigner témoignage→traducteur  | oui        | oui                | non                 |
| Assigner traducteur→planning    | oui        | oui                | non                 |
| Démarrer Mode Culte             | oui        | oui                | oui (si assigné)    |
| Marquer lu/ignoré (Mode Culte)  | oui        | oui                | oui (si assigné)    |
| Upload audio                    | oui        | oui                | non                 |
| Transcrire audio (Whisper)      | oui        | oui                | non                 |

---

## Structure du projet

```
testimony/
├── .env.local                    # Variables d'environnement
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (fonts, providers)
│   │   ├── page.tsx              # Redirect vers /login ou dashboard
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx          # Page de connexion
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx        # Layout admin (sidebar + header)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── services/
│   │   │   │   ├── page.tsx      # Liste des fiches culte
│   │   │   │   └── new/
│   │   │   │       └── page.tsx  # Créer une fiche culte
│   │   │   ├── witnesses/
│   │   │   │   ├── page.tsx      # Liste des témoins
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Fiche témoin
│   │   │   ├── testimonies/
│   │   │   │   ├── page.tsx      # Liste avec filtres
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx  # Créer un témoignage
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Détail témoignage
│   │   │   ├── plans/
│   │   │   │   ├── page.tsx      # Liste des plannings
│   │   │   │   └── new/
│   │   │   │       └── page.tsx  # Créer un planning
│   │   │   └── translators/
│   │   │       └── page.tsx      # Gérer ses traducteurs (inviter, voir)
│   │   │
│   │   └── translator/
│   │       ├── layout.tsx        # Layout traducteur (sidebar + header)
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── testimonies/
│   │       │   ├── page.tsx      # Mes témoignages assignés
│   │       │   └── [id]/
│   │       │       └── page.tsx  # Traduction (autosave)
│   │       └── plans/
│   │           ├── page.tsx      # Mes plannings
│   │           └── [id]/
│   │               ├── page.tsx  # Vue planning (préparation)
│   │               └── culte/
│   │                   └── page.tsx  # MODE CULTE
│   │
│   ├── actions/                  # Server Actions
│   │   ├── auth.ts               # Login, invite, role check
│   │   ├── witnesses.ts          # CRUD témoins
│   │   ├── testimonies.ts        # CRUD témoignages + filtres
│   │   ├── translations.ts       # CRUD traductions (autosave)
│   │   ├── services.ts           # CRUD fiches culte
│   │   ├── plans.ts              # CRUD plannings + assignments
│   │   ├── reading.ts            # Marquer lu/ignoré, historique
│   │   ├── sharing.ts            # Partage inter-admins
│   │   ├── storage.ts            # Upload audio
│   │   └── transcription.ts      # Whisper API
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Client navigateur (auth uniquement)
│   │   │   ├── server.ts         # Client serveur (Server Actions)
│   │   │   └── admin.ts          # Client admin (invitation users)
│   │   ├── types.ts              # Types TypeScript (DB + app)
│   │   └── utils.ts              # Helpers (formatDate, cn, etc.)
│   │
│   ├── hooks/
│   │   ├── use-auth.ts           # Hook auth (session, rôle, profil)
│   │   ├── use-culte-mode.ts     # Hook Mode Culte (scroll, progression)
│   │   └── use-autosave.ts       # Hook autosave pour traductions
│   │
│   ├── components/
│   │   ├── ui/                   # Composants shadcn/ui
│   │   ├── layout/
│   │   │   ├── sidebar.tsx       # Navigation latérale
│   │   │   ├── header.tsx        # En-tête avec user menu
│   │   │   └── mobile-nav.tsx    # Navigation mobile
│   │   ├── testimonies/
│   │   │   ├── testimony-card.tsx
│   │   │   ├── testimony-form.tsx
│   │   │   ├── testimony-filters.tsx
│   │   │   ├── status-badge.tsx
│   │   │   └── audio-upload.tsx
│   │   ├── witnesses/
│   │   │   ├── witness-card.tsx
│   │   │   ├── witness-form.tsx
│   │   │   └── color-tag.tsx
│   │   ├── services/
│   │   │   ├── service-card.tsx
│   │   │   └── service-form.tsx
│   │   ├── plans/
│   │   │   ├── plan-builder.tsx  # Drag & drop des témoignages dans le planning
│   │   │   └── plan-card.tsx
│   │   ├── translations/
│   │   │   └── translation-editor.tsx  # Éditeur avec autosave
│   │   └── culte/
│   │       ├── culte-view.tsx          # Vue principale Mode Culte
│   │       ├── culte-header.tsx        # En-tête avec infos culte
│   │       ├── culte-navigation.tsx    # Barre fixe bas + progression
│   │       ├── culte-sidebar.tsx       # Liste latérale des témoignages
│   │       └── culte-testimony.tsx     # Affichage d'un témoignage en lecture
│   │
│   └── middleware.ts             # Auth + routage par rôle
│
└── public/
    └── fonts/                    # Playfair Display + Inter (si self-hosted)
```

---

## Design System

### Typographie
- **Titres (h1-h3)** : Playfair Display (serif), weight 600-700
- **Corps / UI** : Inter (sans-serif), weight 400-500
- **Mode Culte texte** : Inter, min 18px, line-height 1.75

### Palette de couleurs

| Rôle            | Couleur     | Usage                              |
|-----------------|-------------|------------------------------------|
| Fond principal  | `#FAFAFA`   | Background pages                   |
| Fond carte      | `#FFFFFF`   | Cards, modals                      |
| Texte principal | `#0A0A0A`   | Titres, corps de texte             |
| Texte secondaire| `#64748B`   | Labels, descriptions, placeholders |
| Bordure         | `#E2E8F0`   | Séparateurs, contours de cartes    |
| Accent doré     | `#B8860B`   | Boutons primaires, liens actifs    |
| Accent doré hover| `#996F09`  | Hover sur boutons primaires        |
| Succès          | `#16A34A`   | Badges "Traduit", "Lu"             |
| Avertissement   | `#D97706`   | Badge "En traduction"              |
| Info            | `#2563EB`   | Badge "Reçu"                       |
| Prévu           | `#7C3AED`   | Badge "Planifié"                   |
| Danger          | `#DC2626`   | Suppression, erreurs               |
| Fond sombre     | `#0F172A`   | Mode Culte (fond sombre)           |
| Texte sombre    | `#F1F5F9`   | Mode Culte (texte sur fond sombre) |

### Badges de statut témoignage

| Statut          | Couleur fond | Couleur texte | Label            |
|-----------------|-------------|---------------|------------------|
| received        | `#DBEAFE`   | `#1E40AF`     | Reçu             |
| in_translation  | `#FEF3C7`   | `#92400E`     | En traduction    |
| translated      | `#DCFCE7`   | `#166534`     | Traduit          |
| planned         | `#EDE9FE`   | `#5B21B6`     | Planifié         |
| read            | `#D1FAE5`   | `#065F46`     | Lu               |

### Color tags témoins

| Tag      | Couleur  |
|----------|----------|
| blue     | `#3B82F6` |
| green    | `#22C55E` |
| red      | `#EF4444` |
| yellow   | `#EAB308` |
| purple   | `#A855F7` |

### Composants shadcn/ui à utiliser
- `Button`, `Input`, `Textarea`, `Label`, `Select`
- `Card`, `Badge`, `Avatar`
- `Dialog`, `Sheet` (pour la sidebar Mode Culte)
- `Table` (listes admin)
- `Tabs`, `DropdownMenu`
- `Toast` (notifications)
- `Skeleton` (loading states)
- `Command` (recherche)

---

## Mode Culte — Spécifications détaillées

### Démarrage
1. Le traducteur (ou admin) va sur `/translator/plans/[id]` (ou `/admin/plans/[id]`)
2. Il voit le planning avec tous les témoignages dans l'ordre
3. Bouton "Démarrer la lecture" → navigation vers `/translator/plans/[id]/culte`
4. L'URL `/culte` active le mode plein écran (navbar masquée)

### État local (hook `use-culte-mode`)
```typescript
interface CulteState {
  planId: string;
  currentIndex: number;
  testimonies: CulteTestimony[];
  isDarkMode: boolean;
  isActive: boolean; // true = mode culte démarré
}

interface CulteTestimony {
  id: string;
  witnessName: string;
  content: string;
  translatedContent?: string;
  status: 'pending' | 'read' | 'skipped';
}
```

### Navigation
- **Barre fixe en bas** : affiche "Suivant : [Prénom]" + bouton ▶ + indicateur "3 / 7"
- **Bouton "Ignorer"** : marque le témoignage courant comme `skipped`, passe au suivant
- **Sidebar** (Sheet shadcn/ui, swipe ou bouton hamburger) : liste complète avec icônes de statut
- **Tap sur un item de la sidebar** : saute directement à ce témoignage

### Persistance scroll
```typescript
// Sauvegarde continue
const saveScrollPosition = () => {
  localStorage.setItem(
    `culte_scroll_${planId}`,
    JSON.stringify({ index: currentIndex, scrollY: window.scrollY })
  );
};

// Restauration (Page Visibility API)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    const saved = localStorage.getItem(`culte_scroll_${planId}`);
    if (saved) {
      const { index, scrollY } = JSON.parse(saved);
      setCurrentIndex(index);
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    }
  }
});
```

### Marquage lu (CRITIQUE)
- Ouvrir un témoignage en mode préparation (`/translator/testimonies/[id]`) ne marque RIEN
- Seul le passage au suivant EN MODE CULTE ACTIF (`isActive === true`) déclenche :
  1. Server Action `markAsRead(testimonyId, serviceId, planId)`
  2. Insert dans `reading_occasions`
  3. Update du statut du témoignage vers `'read'` (si pas déjà `'read'`)
  4. Update du state local

### En-tête Mode Culte
```
┌─────────────────────────────────────────┐
│  Titre : La foi qui déplace les monts   │
│  Sujet : Confiance en Dieu              │
│  Inspiration : Renouvellement spirituel │
│  Écritures : Jean 3:16 · Hébreux 11:1  │
└─────────────────────────────────────────┘
```

### Mode sombre (toggle)
- `isDarkMode` en state local + `localStorage`
- Fond : `#0F172A`, texte : `#F1F5F9`
- Toggle accessible dans l'en-tête du mode culte

---

## Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI (optionnel, pour transcription Whisper)
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Ordre d'implémentation

### Phase 1 — Fondations
1. `npx create-next-app@14` avec TypeScript, TailwindCSS, App Router
2. Installer shadcn/ui, configurer le thème (couleurs, fonts)
3. Configurer les clients Supabase (`client.ts`, `server.ts`, `admin.ts`)
4. Middleware Next.js (auth + routage par rôle)

### Phase 2 — Schéma SQL & Auth
5. Exécuter toutes les migrations SQL (tables, triggers, RLS)
6. Seed du super-admin
7. Page `/login` avec email/password
8. Hook `useAuth` (session, profil, rôle)
9. Layouts admin et traducteur (sidebar, header)

### Phase 3 — CRUD Admin
10. CRUD Témoins (`witnesses`) — liste, création, fiche détaillée
11. CRUD Témoignages (`testimonies`) — liste avec filtres, création (texte + audio), détail
12. Upload audio vers Supabase Storage
13. Transcription Whisper (optionnel)
14. CRUD Fiches culte (`services`)
15. Gestion des traducteurs (invitation, liste)
16. Assignation témoignage → traducteur

### Phase 4 — Fonctionnalités Traducteur
17. Dashboard traducteur (assignations + plannings à venir)
18. Liste des témoignages assignés avec statuts
19. Éditeur de traduction avec autosave
20. Vue plannings assignés

### Phase 5 — Plannings & Partage
21. Création de planning (lier à un service, ordonner les témoignages, assigner traducteur)
22. Partage inter-admins de témoignages
23. Dashboard admin (stats, plannings à venir, témoignages en attente)

### Phase 6 — Mode Culte
24. Page `/translator/plans/[id]/culte` (et équivalent admin)
25. Hook `use-culte-mode` (state, scroll, Page Visibility API)
26. UI mobile-first (texte large, boutons larges, plein écran)
27. Navigation : barre fixe bas, progression, sidebar
28. Marquage lu/ignoré via Server Action
29. En-tête avec infos culte
30. Mode sombre (toggle)
31. Tests manuels intensifs sur mobile

### Phase 7 — Polish
32. Loading states (Skeleton)
33. Toasts de confirmation/erreur
34. Responsive final (desktop + tablette + mobile)
35. README.md avec instructions de déploiement

---

## Seed SQL du super-admin

```sql
-- À exécuter APRÈS la création du projet Supabase
-- Remplacer l'email et le mot de passe
-- Ce script utilise l'API admin Supabase (via Dashboard SQL Editor)

-- Le trigger on_auth_user_created créera automatiquement le profil
-- Il faut ensuite mettre à jour le rôle en superadmin :

UPDATE public.profiles
SET role = 'superadmin', full_name = 'Super Admin'
WHERE email = 'admin@temoinapp.com';
```

Note : Le super-admin est créé via le Dashboard Supabase (Authentication > Add User), puis son rôle est mis à jour via SQL.

---

## Conventions de code

- **Nommage fichiers** : kebab-case (`testimony-card.tsx`)
- **Nommage composants** : PascalCase (`TestimonyCard`)
- **Server Actions** : préfixe par domaine (`createTestimony`, `updateWitness`)
- **Types** : dans `lib/types.ts`, nommés en PascalCase
- **Pas de `"use client"` sauf si nécessaire** (interactivité, hooks, event handlers)
- **Erreurs** : retourner `{ error: string }` depuis les Server Actions, jamais throw
- **Validation** : Zod pour valider les inputs des Server Actions
