export const skillCodes = ['vocabulary', 'grammar', 'pronunciation', 'listening', 'reading', 'speaking', 'writing'] as const;
export type SkillCode = typeof skillCodes[number];
export interface Student { avatar?: import("@/features/profile/models").AvatarChoice | null; id: string; studentCode: string; fullName: string; nickname: string | null }
export interface Class { id: string; name: string; subject: string; isActive: boolean }
export interface Unit { id: string; name: string; order: number; hasReport: boolean }
export interface Score { score: number | null; maxScore: number | null; percentage: number | null }
export interface Report { classId: string; unitId: string; testedAt: string | null; total: Score; skills: (Score & {code: SkillCode; comment: string | null})[]; overallComment: string | null; advice: string[] }
export interface ProgressEntry { unitId: string; unitOrder: number; unitName: string; totalPercentage: number | null; skills: Record<SkillCode, number | null> }
export interface Material { id: string; title: string; type: 'pdf' | 'audio' | 'video' | 'link'; unitId: string | null; sizeBytes: number | null; durationSeconds: number | null }
export interface Access { url: string; expiresAt: string }
export interface AuthSession { accessToken: string; tokenType: 'Bearer'; expiresAt: string; student: Student }
export interface Envelope<T> { data: T }
export interface ApplicationSettings { appName: string; classIdPrefix: string; version: number; schemaReady?: boolean }
export interface ApiFailure { error: { code: string; message: string; fieldErrors?: Record<string, string> } }
