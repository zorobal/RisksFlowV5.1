import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get credentials from environment variables or localStorage overrides
export const getSupabaseConfig = () => {
  const localUrl = localStorage.getItem('supabase_url_override');
  const localKey = localStorage.getItem('supabase_key_override');

  const meta = import.meta as any;
  return {
    url: localUrl || meta.env?.VITE_SUPABASE_URL || '',
    key: localKey || meta.env?.VITE_SUPABASE_ANON_KEY || '',
    isOverridden: !!(localUrl && localKey),
    isEnvSet: !!(meta.env?.VITE_SUPABASE_URL && meta.env?.VITE_SUPABASE_ANON_KEY),
  };
};

// Lazy initialization of Supabase client
let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  try {
    // Recreate if config changes or not initialized
    if (!clientInstance) {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: false
        }
      });
    }
    return clientInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};

// Reset the client instance (used when user changes credentials in the UI)
export const resetSupabaseClient = () => {
  clientInstance = null;
};

// Test connection
export const testSupabaseConnection = async (url: string, key: string): Promise<{ success: boolean; message: string }> => {
  try {
    const tempClient = createClient(url, key, {
      auth: { persistSession: false }
    });
    
    // We try to query a standard metadata table or do a dummy request.
    // Querying 'tenants' table. If table does not exist, but connection works,
    // Supabase will return a 406 or a 404/400 with a database error but HTTP status is ok.
    // If the API key or URL is invalid, it throws a connection error.
    const { error } = await tempClient.from('tenants').select('id').limit(1);
    
    if (error && error.message && error.message.includes('FetchError')) {
      return { success: false, message: 'Erreur de connexion : Impossible de joindre l\'URL Supabase.' };
    }
    
    if (error && error.code === 'PGRST116') {
      // Row not found or empty table is fine
      return { success: true, message: 'Connexion réussie ! (La table "tenants" est vide ou prête)' };
    }
    
    if (error && error.code === '42P01') {
      // Table does not exist (42P01: relation "tenants" does not exist)
      // This is a SUCCESSFUL connection because the database responded! It just means the tables are not created yet.
      return { 
        success: true, 
        message: 'Connexion réussie au projet ! Les tables ne sont pas encore créées. Utilisez le script SQL pour les initialiser.' 
      };
    }

    if (error) {
      return { success: false, message: `Erreur Supabase (${error.code}) : ${error.message}` };
    }

    return { success: true, message: 'Connexion réussie et table "tenants" détectée !' };
  } catch (error: any) {
    return { success: false, message: `Échec de la connexion : ${error?.message || 'Identifiants incorrects'}` };
  }
};

// Generate complete SQL script to create all tables in Supabase SQL Editor
export const getSqlSchema = (): string => {
  return `-- ==========================================
-- SCRIPT D'INITIALISATION POUR SUPABASE
-- Copiez-collez ce code dans le "SQL Editor" de Supabase
-- et cliquez sur "Run" pour créer toutes les tables GRC.
-- ==========================================

-- 1. Table des Organisations (Multi-Tenant)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  scales JSONB NOT NULL,
  formula JSONB NOT NULL,
  matrix_size INTEGER NOT NULL DEFAULT 4,
  matrix_thresholds JSONB NOT NULL,
  workflow_steps JSONB NOT NULL,
  categories JSONB NOT NULL,
  entities JSONB NOT NULL
);

-- 2. Table des Utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  password TEXT,
  tenant_id TEXT
);

-- 3. Table des Risques (Modèle IFACI / COSO)
CREATE TABLE IF NOT EXISTS risks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status_id TEXT NOT NULL,
  frequency_value INTEGER NOT NULL,
  impact_value INTEGER NOT NULL,
  control_value INTEGER NOT NULL,
  score_brut INTEGER NOT NULL,
  score_residuel INTEGER NOT NULL,
  history JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 4. Table des Plans d'Actions
CREATE TABLE IF NOT EXISTS action_plans (
  id TEXT PRIMARY KEY,
  risk_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  due_date TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0
);

-- 5. Table des Logs d'Audit GRC
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  tenant_id TEXT NOT NULL
);

-- 6. Table des Fonctions métiers
CREATE TABLE IF NOT EXISTS fonctions (
  id TEXT PRIMARY KEY,
  libelle TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  habilitation_profile_id TEXT NOT NULL
);

-- 7. Table des Affectations de postes
CREATE TABLE IF NOT EXISTS affectations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  fonction_id TEXT NOT NULL,
  date_debut TEXT NOT NULL,
  date_fin TEXT,
  statut TEXT NOT NULL
);

-- 8. Table des Règles métier No-Code
CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  libelle TEXT NOT NULL,
  type_regle TEXT NOT NULL,
  objet_cible TEXT NOT NULL,
  condition JSONB NOT NULL,
  action JSONB NOT NULL,
  priorite INTEGER NOT NULL,
  statut TEXT NOT NULL,
  entity_id TEXT
);

-- 9. Table des Profils d'Habilitation
CREATE TABLE IF NOT EXISTS access_profiles (
  id TEXT PRIMARY KEY,
  libelle TEXT NOT NULL,
  portee TEXT NOT NULL,
  droits JSONB NOT NULL
);

-- 10. Table des Missions d'Audit Interne
CREATE TABLE IF NOT EXISTS audit_missions (
  id TEXT PRIMARY KEY,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  pilote_fonction_id TEXT NOT NULL
);

-- 11. Table des Constats/Recommandations d'Audit
CREATE TABLE IF NOT EXISTS audit_findings (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  gravite TEXT NOT NULL,
  recommandation TEXT NOT NULL,
  statut TEXT NOT NULL,
  plan_remediation_id TEXT
);

-- 12. Table des Référentiels de Conformité
CREATE TABLE IF NOT EXISTS compliance_frameworks (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  version TEXT NOT NULL,
  secteur TEXT NOT NULL
);

-- 13. Table des Obligations réglementaires
CREATE TABLE IF NOT EXISTS compliance_obligations (
  id TEXT PRIMARY KEY,
  framework_id TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  statut TEXT NOT NULL,
  responsable_fonction_id TEXT NOT NULL,
  derniere_revue TEXT NOT NULL
);

-- 14. Table des Incidents déclarés
CREATE TABLE IF NOT EXISTS compliance_incidents (
  id TEXT PRIMARY KEY,
  date_occurrence TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_financier INTEGER,
  statut_declaration TEXT NOT NULL,
  mesures_prises TEXT NOT NULL
);

-- 15. Table des Entreprises Clients (SuperAdmin)
CREATE TABLE IF NOT EXISTS entreprises (
  id TEXT PRIMARY KEY,
  raison_sociale TEXT NOT NULL,
  secteur_activite TEXT NOT NULL,
  date_creation_compte TEXT NOT NULL,
  statut_compte TEXT NOT NULL,
  region_hebergement TEXT NOT NULL,
  id_contact_principal TEXT NOT NULL
);

-- 16. Table des Licences d'abonnement
CREATE TABLE IF NOT EXISTS licences (
  id TEXT PRIMARY KEY,
  entreprise_id TEXT NOT NULL,
  type_abonnement TEXT NOT NULL,
  nombre_utilisateurs_max INTEGER NOT NULL,
  nombre_utilisateurs_actuel INTEGER NOT NULL,
  modules_actives JSONB NOT NULL,
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  statut_licence TEXT NOT NULL
);

-- 17. Table de l'Historique d'administration des licences
CREATE TABLE IF NOT EXISTS historique_licences (
  id TEXT PRIMARY KEY,
  licence_id TEXT NOT NULL,
  type_changement TEXT NOT NULL,
  date_changement TEXT NOT NULL,
  effectue_par TEXT NOT NULL,
  details TEXT NOT NULL
);

-- Activer Row Level Security (RLS) ou autoriser l'accès anonyme
-- (Pour les prototypes simples, vous pouvez désactiver RLS ou configurer des politiques permissives)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fonctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affectations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE licences ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique_licences ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès complet pour l'API Anon Key (Copie de secours)
CREATE POLICY "Allow public select" ON tenants FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON tenants FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON tenants FOR DELETE USING (true);

-- Faites de même pour toutes les autres tables si vous souhaitez un accès direct rapide avec la clé publique d'API :
CREATE POLICY "Allow all users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all risks" ON risks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions" ON action_plans FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all logs" ON audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all fonctions" ON fonctions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all affectations" ON affectations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all rules" ON rules FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all profiles" ON access_profiles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all missions" ON audit_missions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all findings" ON audit_findings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all frameworks" ON compliance_frameworks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all obligations" ON compliance_obligations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all incidents" ON compliance_incidents FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all entreprises" ON entreprises FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all licences" ON licences FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all historique" ON historique_licences FOR ALL TO anon USING (true) WITH CHECK (true);
`;
};

// Map local object schema properties to Supabase column names
const mapTenantToDb = (t: any) => ({
  id: t.id,
  company_name: t.companyName,
  logo_url: t.logoUrl || null,
  scales: t.scales,
  formula: t.formula,
  matrix_size: t.matrixSize,
  matrix_thresholds: t.matrixThresholds,
  workflow_steps: t.workflowSteps,
  categories: t.categories,
  entities: t.entities,
});

const mapTenantFromDb = (t: any) => ({
  id: t.id,
  companyName: t.company_name,
  logoUrl: t.logo_url,
  scales: t.scales,
  formula: t.formula,
  matrixSize: t.matrix_size,
  matrixThresholds: t.matrix_thresholds,
  workflowSteps: t.workflow_steps,
  categories: t.categories,
  entities: t.entities,
});

const mapRiskToDb = (r: any) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  category_id: r.categoryId,
  entity_id: r.entityId,
  created_by: r.createdBy,
  created_at: r.createdAt,
  status_id: r.statusId,
  frequency_value: r.frequencyValue,
  impact_value: r.impactValue,
  control_value: r.controlValue,
  score_brut: r.scoreBrut,
  score_residuel: r.scoreResiduel,
  history: r.history,
});

const mapRiskFromDb = (r: any) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  categoryId: r.category_id,
  entityId: r.entity_id,
  createdBy: r.created_by,
  createdAt: r.created_at,
  statusId: r.status_id,
  frequencyValue: r.frequency_value,
  impactValue: r.impact_value,
  controlValue: r.control_value,
  scoreBrut: r.score_brut,
  scoreResiduel: r.score_residuel,
  history: r.history,
});

const mapActionToDb = (a: any) => ({
  id: a.id,
  risk_id: a.riskId,
  title: a.title,
  description: a.description,
  owner_name: a.ownerName,
  due_date: a.dueDate,
  priority: a.priority,
  status: a.status,
  progress: a.progress,
});

const mapActionFromDb = (a: any) => ({
  id: a.id,
  riskId: a.risk_id,
  title: a.title,
  description: a.description,
  ownerName: a.owner_name,
  dueDate: a.due_date,
  priority: a.priority,
  status: a.status,
  progress: a.progress,
});

const mapAuditLogToDb = (l: any) => ({
  id: l.id,
  timestamp: l.timestamp,
  user_id: l.userId,
  user_name: l.userName,
  user_role: l.userRole,
  action: l.action,
  details: l.details,
  tenant_id: l.tenantId,
});

const mapAuditLogFromDb = (l: any) => ({
  id: l.id,
  timestamp: l.timestamp,
  userId: l.user_id,
  userName: l.user_name,
  userRole: l.user_role,
  action: l.action,
  details: l.details,
  tenantId: l.tenant_id,
});

const mapUserToDb = (u: any) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatar: u.avatar || null,
  password: u.password || null,
  tenant_id: u.tenantId || null,
});

const mapUserFromDb = (u: any) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatar: u.avatar || undefined,
  password: u.password || undefined,
  tenantId: u.tenant_id || undefined,
  allowedModules: u.role === 'SuperAdmin' || u.role === 'Administrateur'
    ? ['dashboard', 'risks', 'evaluation', 'heatmap', 'actions', 'audit', 'compliance', 'reporting']
    : ['dashboard', 'risks', 'evaluation', 'heatmap', 'actions'],
});

const mapFonctionToDb = (f: any) => ({
  id: f.id,
  libelle: f.libelle,
  entity_id: f.entityId,
  habilitation_profile_id: f.habilitationProfileId,
});

const mapFonctionFromDb = (f: any) => ({
  id: f.id,
  libelle: f.libelle,
  entityId: f.entity_id,
  habilitationProfileId: f.habilitation_profile_id,
});

const mapAffectationToDb = (a: any) => ({
  id: a.id,
  user_id: a.userId,
  fonction_id: a.fonctionId,
  date_debut: a.dateDebut,
  date_fin: a.dateFin || null,
  statut: a.statut,
});

const mapAffectationFromDb = (a: any) => ({
  id: a.id,
  userId: a.user_id,
  fonctionId: a.fonction_id,
  dateDebut: a.date_debut,
  dateFin: a.date_fin || undefined,
  statut: a.statut,
});

const mapRuleToDb = (r: any) => ({
  id: r.id,
  libelle: r.libelle,
  type_regle: r.typeRegle,
  objet_cible: r.objetCible,
  condition: r.condition,
  action: r.action,
  priorite: r.priorite,
  statut: r.statut,
  entity_id: r.entityId || null,
});

const mapRuleFromDb = (r: any) => ({
  id: r.id,
  libelle: r.libelle,
  typeRegle: r.type_regle,
  objetCible: r.objet_cible,
  condition: r.condition,
  action: r.action,
  priorite: r.priorite,
  statut: r.statut,
  entityId: r.entity_id || undefined,
});

const mapAuditMissionToDb = (m: any) => ({
  id: m.id,
  titre: m.titre,
  description: m.description,
  type: m.type,
  status: m.status,
  date_debut: m.dateDebut,
  date_fin: m.dateFin,
  pilote_fonction_id: m.piloteFonctionId,
});

const mapAuditMissionFromDb = (m: any) => ({
  id: m.id,
  titre: m.titre,
  description: m.description,
  type: m.type,
  status: m.status,
  dateDebut: m.date_debut,
  dateFin: m.date_fin,
  piloteFonctionId: m.pilote_fonction_id,
});

const mapAuditFindingToDb = (f: any) => ({
  id: f.id,
  mission_id: f.missionId,
  titre: f.titre,
  description: f.description,
  gravite: f.gravite,
  recommandation: f.recommandation,
  statut: f.statut,
  plan_remediation_id: f.planRemediationId || null,
});

const mapAuditFindingFromDb = (f: any) => ({
  id: f.id,
  missionId: f.mission_id,
  titre: f.titre,
  description: f.description,
  gravite: f.gravite,
  recommandation: f.recommandation,
  statut: f.statut,
  planRemediationId: f.plan_remediation_id || undefined,
});

const mapComplianceObligationToDb = (o: any) => ({
  id: o.id,
  framework_id: o.frameworkId,
  titre: o.titre,
  description: o.description,
  statut: o.statut,
  responsable_fonction_id: o.responsableFonctionId,
  derniere_revue: o.derniereRevue,
});

const mapComplianceObligationFromDb = (o: any) => ({
  id: o.id,
  frameworkId: o.framework_id,
  titre: o.titre,
  description: o.description,
  statut: o.statut,
  responsableFonctionId: o.responsable_fonction_id,
  derniereRevue: o.derniere_revue,
});

const mapComplianceIncidentToDb = (i: any) => ({
  id: i.id,
  date_occurrence: i.dateOccurrence,
  titre: i.titre,
  description: i.description,
  impact_financier: i.impactFinancier || null,
  statut_declaration: i.statutDeclaration,
  mesures_prises: i.mesuresPrises,
});

const mapComplianceIncidentFromDb = (i: any) => ({
  id: i.id,
  dateOccurrence: i.date_occurrence,
  titre: i.titre,
  description: i.description,
  impactFinancier: i.impact_financier || undefined,
  statutDeclaration: i.statut_declaration,
  mesuresPrises: i.mesures_prises,
});

const mapEntrepriseToDb = (e: any) => ({
  id: e.id,
  raison_sociale: e.raisonSociale,
  secteur_activite: e.secteurActivite,
  date_creation_compte: e.dateCreationCompte,
  statut_compte: e.statutCompte,
  region_hebergement: e.regionHebergement,
  id_contact_principal: e.idContactPrincipal,
});

const mapEntrepriseFromDb = (e: any) => ({
  id: e.id,
  raisonSociale: e.raison_sociale,
  secteurActivite: e.secteur_activite,
  dateCreationCompte: e.date_creation_compte,
  statutCompte: e.statut_compte,
  regionHebergement: e.region_hebergement,
  idContactPrincipal: e.id_contact_principal,
});

const mapLicenceToDb = (l: any) => ({
  id: l.id,
  entreprise_id: l.entrepriseId,
  type_abonnement: l.typeAbonnement,
  nombre_utilisateurs_max: l.nombreUtilisateursMax,
  nombre_utilisateurs_actuel: l.nombreUtilisateursActuel,
  modules_actives: l.modulesActives,
  date_debut: l.dateDebut,
  date_fin: l.dateFin,
  statut_licence: l.statutLicence,
});

const mapLicenceFromDb = (l: any) => ({
  id: l.id,
  entrepriseId: l.entreprise_id,
  typeAbonnement: l.type_abonnement,
  nombreUtilisateursMax: l.nombre_utilisateurs_max,
  nombreUtilisateursActuel: l.nombre_utilisateurs_actuel,
  modulesActives: l.modules_actives,
  dateDebut: l.date_debut,
  dateFin: l.date_fin,
  statutLicence: l.statut_licence,
});

const mapHistoriqueLicenceToDb = (h: any) => ({
  id: h.id,
  licence_id: h.licenceId,
  type_changement: h.typeChangement,
  date_changement: h.dateChangement,
  effectue_par: h.effectuePar,
  details: h.details,
});

const mapHistoriqueLicenceFromDb = (h: any) => ({
  id: h.id,
  licenceId: h.licence_id,
  typeChangement: h.type_changement,
  dateChangement: h.date_changement,
  effectuePar: h.effectue_par,
  details: h.details,
});

// Sync data to Supabase (PUSH)
export const pushAllToSupabase = async (
  client: SupabaseClient,
  data: {
    tenants: any[];
    users: any[];
    risks: any[];
    actions: any[];
    auditLogs: any[];
    fonctions: any[];
    affectations: any[];
    rules: any[];
    accessProfiles: any[];
    auditMissions: any[];
    auditFindings: any[];
    complianceFrameworks: any[];
    complianceObligations: any[];
    complianceIncidents: any[];
    entreprises: any[];
    licences: any[];
    historiqueLicences: any[];
  }
): Promise<{ success: boolean; errorCount: number; messages: string[] }> => {
  const results: string[] = [];
  let errorCount = 0;

  const pushTable = async (tableName: string, items: any[], mapper: (item: any) => any) => {
    if (!items || items.length === 0) return;
    const mapped = items.map(mapper);
    
    // Deduplicate mapped items by 'id' to prevent PostgreSQL "ON CONFLICT DO UPDATE command cannot affect row a second time (21000)"
    const uniqueMap = new Map<string, any>();
    for (const item of mapped) {
      if (item && item.id) {
        uniqueMap.set(item.id, item);
      }
    }
    const deduplicated = Array.from(uniqueMap.values());
    
    // Using upsert with standard id column
    const { error } = await client.from(tableName).upsert(deduplicated);
    if (error) {
      errorCount++;
      results.push(`Échec sur "${tableName}" : ${error.message} (${error.code})`);
      console.error(`Error syncing table ${tableName}:`, error);
    } else {
      results.push(`Sinc. réussie : "${tableName}" (${items.length} lignes)`);
    }
  };

  try {
    await pushTable('tenants', data.tenants, mapTenantToDb);
    await pushTable('users', data.users, mapUserToDb);
    await pushTable('risks', data.risks, mapRiskToDb);
    await pushTable('action_plans', data.actions, mapActionToDb);
    await pushTable('audit_logs', data.auditLogs, mapAuditLogToDb);
    await pushTable('fonctions', data.fonctions, mapFonctionToDb);
    await pushTable('affectations', data.affectations, mapAffectationToDb);
    await pushTable('rules', data.rules, mapRuleToDb);
    await pushTable('access_profiles', data.accessProfiles, (x) => x); // Access profiles matches directly
    await pushTable('audit_missions', data.auditMissions, mapAuditMissionToDb);
    await pushTable('audit_findings', data.auditFindings, mapAuditFindingToDb);
    await pushTable('compliance_frameworks', data.complianceFrameworks, (x) => x); // Matches directly
    await pushTable('compliance_obligations', data.complianceObligations, mapComplianceObligationToDb);
    await pushTable('compliance_incidents', data.complianceIncidents, mapComplianceIncidentToDb);
    await pushTable('entreprises', data.entreprises, mapEntrepriseToDb);
    await pushTable('licences', data.licences, mapLicenceToDb);
    await pushTable('historique_licences', data.historiqueLicences, mapHistoriqueLicenceToDb);

    return {
      success: errorCount === 0,
      errorCount,
      messages: results,
    };
  } catch (err: any) {
    return {
      success: false,
      errorCount: errorCount + 1,
      messages: [...results, `Erreur fatale de push : ${err.message}`],
    };
  }
};

// Sync data from Supabase (PULL)
export const pullAllFromSupabase = async (client: SupabaseClient): Promise<{ success: boolean; data: any; message: string }> => {
  try {
    const pullTable = async (tableName: string) => {
      const { data, error } = await client.from(tableName).select('*');
      if (error) {
        throw new Error(`Échec de lecture sur "${tableName}" : ${error.message}`);
      }
      return data || [];
    };

    const tenantsRaw = await pullTable('tenants');
    const users = await pullTable('users');
    const risksRaw = await pullTable('risks');
    const actionsRaw = await pullTable('action_plans');
    const auditLogsRaw = await pullTable('audit_logs');
    const fonctionsRaw = await pullTable('fonctions');
    const affectationsRaw = await pullTable('affectations');
    const rulesRaw = await pullTable('rules');
    const accessProfiles = await pullTable('access_profiles');
    const auditMissionsRaw = await pullTable('audit_missions');
    const auditFindingsRaw = await pullTable('audit_findings');
    const complianceFrameworks = await pullTable('compliance_frameworks');
    const complianceObligationsRaw = await pullTable('compliance_obligations');
    const complianceIncidentsRaw = await pullTable('compliance_incidents');
    const entreprisesRaw = await pullTable('entreprises');
    const licencesRaw = await pullTable('licences');
    const historiqueLicencesRaw = await pullTable('historique_licences');

    const mappedData = {
      tenants: tenantsRaw.map(mapTenantFromDb),
      users: users.map(mapUserFromDb),
      risks: risksRaw.map(mapRiskFromDb),
      actions: actionsRaw.map(mapActionFromDb),
      auditLogs: auditLogsRaw.map(mapAuditLogFromDb),
      fonctions: fonctionsRaw.map(mapFonctionFromDb),
      affectations: affectationsRaw.map(mapAffectationFromDb),
      rules: rulesRaw.map(mapRuleFromDb),
      accessProfiles,
      auditMissions: auditMissionsRaw.map(mapAuditMissionFromDb),
      auditFindings: auditFindingsRaw.map(mapAuditFindingFromDb),
      complianceFrameworks,
      complianceObligations: complianceObligationsRaw.map(mapComplianceObligationFromDb),
      complianceIncidents: complianceIncidentsRaw.map(mapComplianceIncidentFromDb),
      entreprises: entreprisesRaw.map(mapEntrepriseFromDb),
      licences: licencesRaw.map(mapLicenceFromDb),
      historiqueLicences: historiqueLicencesRaw.map(mapHistoriqueLicenceFromDb),
    };

    return {
      success: true,
      data: mappedData,
      message: 'Données récupérées avec succès depuis Supabase !',
    };
  } catch (error: any) {
    console.error('Failed to pull from Supabase:', error);
    return {
      success: false,
      data: null,
      message: error?.message || 'Une erreur est survenue lors de la récupération des données.',
    };
  }
};
