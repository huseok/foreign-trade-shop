/** 挂在 `AdminLayout` 内；Modal `getContainer` 指向此处可避免 rc-dialog Portal 锁定 body 滚动。 */
export const ADMIN_MODAL_ROOT_ID = 'admin-modal-container-root'

export function getAdminModalContainer(): HTMLElement {
  return document.getElementById(ADMIN_MODAL_ROOT_ID) ?? document.body
}
