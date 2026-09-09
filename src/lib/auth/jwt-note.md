Both remaining role strings are now confirmed against live tokens:

  resident      ✓ confirmed
  estate_admin  ✓ confirmed
  security      ✓ confirmed  (this phase)
  super_admin   — still a guess
  business_owner — still a guess

No code change needed: ROLES already had `security: "security"`, which
turned out to be right. super_admin remains unverified because no such
account exists to test with.
