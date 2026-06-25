import Modal from './Modal'

interface Props {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title = 'Confirmar',
  message,
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <div className="flex gap-3">
        <button className="btn-ghost flex-1" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn-danger flex-1" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
