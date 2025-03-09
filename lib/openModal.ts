// 类型定义
type RenderType = string | number | HTMLElement | ((h: () => HTMLElement) => HTMLElement)
type ModeType = 'modal' | 'drawer'

interface OpenModalProps {
  title: RenderType
  mode?: ModeType
  width?: string | number
  height?: number | string
  zIndex?: number
  isFullScreen?: boolean
  getContainer?: () => HTMLElement
  onCloseEvent?: () => void
  content?: RenderType
  isOpenMore?: boolean
  mask?: boolean
  escClose?: boolean
  footer?: {
    isContinue?: boolean
    isOk?: boolean
    isCancel?: boolean
    canText?: string | number
    okText?: string | number
    okDisabled?: boolean
    footerLeft?: RenderType
    footerButtonCenter?: RenderType
    footerRight?: RenderType
  } | boolean | RenderType
  visibleChange?: (visible: boolean) => void
  onCancel?: () => Promise<void> | void
  onOk?: () => Promise<void> | void
  placement?: 'top' | 'right' | 'bottom' | 'left'
  isResize?: boolean
  resizeOptions?: Record<string, any>
  onOpenChange?: (status: boolean) => void
  zoomFromMouse?: boolean // 新增参数
}

interface ModalMapItem {
  wrapperEl: HTMLElement
  modalKey: string
  props: OpenModalProps
  removeEventListenerChangeZIndex: () => void
}

export function openModal (props: OpenModalProps): ModalMapItem {
  const {
    title,
    mode = 'modal',
    width = '50%',
    height = 'auto',
    zIndex = 1000,
    isFullScreen = false,
    getContainer = () => document.body,
    onCloseEvent,
    content,
    isOpenMore = false,
    mask = true,
    escClose = true,
    footer = true,
    visibleChange,
    onCancel,
    onOk,
    placement = 'right',
    isResize = false,
    resizeOptions = {},
    onOpenChange,
    zoomFromMouse = false // 获取 zoomFromMouse 参数
  } = props

  const mouseX = zoomFromMouse ? (window.event?.clientX || window.innerWidth / 2) : window.innerWidth / 2
  const mouseY = zoomFromMouse ? (window.event?.clientY || window.innerHeight / 2) : window.innerHeight / 2

  const wrapperEl = document.createElement('div')
  wrapperEl.style.position = 'fixed'
  wrapperEl.style.top = '0'
  wrapperEl.style.left = '0'
  wrapperEl.style.width = '100%'
  wrapperEl.style.height = '100%'
  wrapperEl.style.zIndex = zIndex.toString()
  wrapperEl.style.display = 'flex'
  wrapperEl.style.justifyContent = 'center'
  wrapperEl.style.alignItems = 'center'
  wrapperEl.style.transition = 'background-color 0.3s ease' // 为 mask 添加透明度变化动画

  const modalEl = document.createElement('div')
  modalEl.style.width = typeof width === 'number' ? `${width}px` : width
  modalEl.style.height = typeof height === 'number' ? `${height}px` : height
  modalEl.style.backgroundColor = '#fff'
  modalEl.style.borderRadius = '4px'
  modalEl.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
  modalEl.style.position = 'absolute'
  modalEl.style.left = `${mouseX}px`
  modalEl.style.top = `${mouseY}px`
  modalEl.style.transformOrigin = 'center'
  modalEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
  modalEl.style.opacity = '0'
  modalEl.style.transform = zoomFromMouse ? 'scale(0)' : 'translate(-50%, -50%) scale(0)' // 初始时从点击位置或中间缩放

  const titleEl = document.createElement('div')
  titleEl.style.padding = '16px'
  titleEl.style.borderBottom = '1px solid #e8e8e8'
  titleEl.style.fontSize = '16px'
  titleEl.style.fontWeight = 'bold'
  titleEl.textContent = typeof title === 'function' ? title() : title.toString()
  modalEl.appendChild(titleEl)

  const contentEl = document.createElement('div')
  contentEl.className = 'modal-content'
  contentEl.style.padding = '16px'

  if (typeof content === 'string' || typeof content === 'number') {
    contentEl.innerHTML = content.toString()
  } else if (content instanceof HTMLElement) {
    contentEl.appendChild(content)
  }

  modalEl.appendChild(contentEl)

  if (footer) {
    const footerEl = document.createElement('div')
    footerEl.style.padding = '16px'
    footerEl.style.borderTop = '1px solid #e8e8e8'
    footerEl.style.textAlign = 'right'

    if (typeof footer === 'object' && !Array.isArray(footer)) {
      const { isOk = true, isCancel = true, okText = '确定', canText = '取消' } = footer

      if (isCancel) {
        const cancelButton = document.createElement('button')
        cancelButton.textContent = canText
        cancelButton.onclick = () => {
          onCancel?.()
          closeModal()
        }
        footerEl.appendChild(cancelButton)
      }

      if (isOk) {
        const okButton = document.createElement('button')
        okButton.textContent = okText
        okButton.onclick = () => {
          onOk?.()
          closeModal()
        }
        footerEl.appendChild(okButton)
      }
    }

    modalEl.appendChild(footerEl)
  }

  wrapperEl.appendChild(modalEl)
  const container = getContainer()
  container.appendChild(wrapperEl)

  setTimeout(() => {
    modalEl.style.transform = 'translate(-50%, -50%) scale(1)' // 在加载完成后，平滑地缩放至原始大小
    modalEl.style.opacity = '1'
    if (mask) {
      wrapperEl.style.backgroundColor = 'rgba(0, 0, 0, 0.5)' // 显示 mask 时，透明度逐渐变为 0.5
    }
  }, 0)

  function closeModal () {
    if (mask) {
      wrapperEl.style.backgroundColor = 'rgba(0, 0, 0, 0)' // 关闭时，mask 透明度逐渐变为 0
    }
    modalEl.style.transform = zoomFromMouse ? 'scale(0)' : 'translate(-50%, -50%) scale(0)' // 关闭时缩小
    modalEl.style.opacity = '0'

    setTimeout(() => {
      onCloseEvent?.()
      wrapperEl.remove()
      onOpenChange?.(false)
    }, 300)
  }

  return {
    wrapperEl,
    modalKey: `modal-${Date.now()}`,
    props,
    removeEventListenerChangeZIndex: () => {}
  }
}
