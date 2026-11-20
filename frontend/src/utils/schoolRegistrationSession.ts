export function clearPendingSchoolRegistrationSession(
  storage: Pick<Storage, 'removeItem'> = window.sessionStorage,
) {
  storage.removeItem('schoolos_pending_school_registration');
  storage.removeItem('edusphere_pending_school_registration');
}
