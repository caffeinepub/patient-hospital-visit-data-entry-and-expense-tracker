import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface VisitEntry {
    id: bigint;
    owner: Principal;
    createdAt: Time;
    visitDate: bigint;
    hospitalRs: bigint;
    address: string;
    patientName: string;
    hospitalName: string;
    doctorName: string;
    medicineRs: bigint;
    medicineName: string;
}
export type Time = bigint;
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createVisitEntry(hospitalName: string, visitDate: bigint, doctorName: string, patientName: string, hospitalRs: bigint, medicineRs: bigint, medicineName: string, address: string): Promise<bigint>;
    deleteVisitEntry(id: bigint, originalHospitalName: string): Promise<void>;
    editVisitEntry(id: bigint, hospitalName: string, visitDate: bigint, doctorName: string, patientName: string, hospitalRs: bigint, medicineRs: bigint, medicineName: string, address: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserVisitEntries(): Promise<Array<VisitEntry>>;
    getVisitEntry(id: bigint): Promise<VisitEntry>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
