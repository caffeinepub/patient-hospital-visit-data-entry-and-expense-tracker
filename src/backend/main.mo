import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Visit Entry Type
  type VisitEntry = {
    id : Nat;
    createdAt : Time.Time;
    hospitalName : Text;
    visitDate : Int;
    doctorName : Text;
    patientName : Text;
    hospitalRs : Nat;
    medicineRs : Nat;
    medicineName : Text;
    address : Text;
    owner : Principal;
  };

  var nextId = 0;
  let visitEntries = Map.empty<Nat, VisitEntry>();

  public shared ({ caller }) func createVisitEntry(
    hospitalName : Text,
    visitDate : Int,
    doctorName : Text,
    patientName : Text,
    hospitalRs : Nat,
    medicineRs : Nat,
    medicineName : Text,
    address : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create visit entries");
    };
    let id = nextId;
    let newEntry : VisitEntry = {
      id;
      createdAt = Time.now();
      hospitalName;
      visitDate;
      doctorName;
      patientName;
      hospitalRs;
      medicineRs;
      medicineName;
      address;
      owner = caller;
    };
    visitEntries.add(id, newEntry);
    nextId += 1;
    id;
  };

  public query ({ caller }) func getUserVisitEntries() : async [VisitEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve visit entries");
    };

    visitEntries.entries()
    .filter(
      func((_, entry)) {
        entry.owner == caller;
      }
    )
    .map(
      func((_, entry)) {
        entry;
      }
    )
    .toArray();
  };

  public shared ({ caller }) func editVisitEntry(
    id : Nat,
    hospitalName : Text,
    visitDate : Int,
    doctorName : Text,
    patientName : Text,
    hospitalRs : Nat,
    medicineRs : Nat,
    medicineName : Text,
    address : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit visit entries");
    };
    switch (visitEntries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?existingEntry) {
        if (existingEntry.owner != caller) {
          Runtime.trap("Unauthorized: You do not own this entry");
        };
        let updatedEntry : VisitEntry = {
          existingEntry with
          hospitalName;
          visitDate;
          doctorName;
          patientName;
          hospitalRs;
          medicineRs;
          medicineName;
          address;
        };
        visitEntries.add(id, updatedEntry);
      };
    };
  };

  public shared ({ caller }) func deleteVisitEntry(id : Nat, originalHospitalName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete visit entries");
    };
    switch (visitEntries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) {
        if (entry.owner != caller) {
          Runtime.trap("Unauthorized: You do not own this entry");
        };
        if (not Text.equal(entry.hospitalName, originalHospitalName)) {
          Runtime.trap("Confirmation hospital name does not match original");
        };
        visitEntries.remove(id);
      };
    };
  };

  public query ({ caller }) func getVisitEntry(id : Nat) : async VisitEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access visit entries");
    };
    switch (visitEntries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) {
        if (entry.owner != caller) {
          Runtime.trap("Unauthorized: You do not own this entry");
        };
        entry;
      };
    };
  };
};

