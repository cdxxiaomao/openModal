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
}

interface ModalMapItem {
  wrapperEl: HTMLElement
  modalKey: string
  props: OpenModalProps
  removeEventListenerChangeZIndex: () => void
}

/**
 * 打开一个模态框
 * @param props 模态框的配置
 * @returns ModalMapItem
 */
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
    onOpenChange
  } = props

  // 创建模态框的容器
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
  wrapperEl.style.backgroundColor = mask ? 'rgba(0, 0, 0, 0.5)' : 'transparent'

  // 创建模态框内容
  const modalEl = document.createElement('div')
  modalEl.style.width = typeof width === 'number' ? `${width}px` : width
  modalEl.style.height = typeof height === 'number' ? `${height}px` : height
  modalEl.style.backgroundColor = '#fff'
  modalEl.style.borderRadius = '4px'
  modalEl.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
  modalEl.style.position = 'relative'

  // 添加标题
  const titleEl = document.createElement('div')
  titleEl.style.padding = '16px'
  titleEl.style.borderBottom = '1px solid #e8e8e8'
  titleEl.style.fontSize = '16px'
  titleEl.style.fontWeight = 'bold'
  titleEl.textContent = typeof title === 'function' ? title() : title.toString()
  modalEl.appendChild(titleEl)

  // 添加内容区域
  const contentEl = document.createElement('div')
  contentEl.className = 'modal-content' // 为内容区域添加类名
  contentEl.style.padding = '16px'

  // 如果 content 是字符串或数字，直接渲染
  if (typeof content === 'string' || typeof content === 'number') {
    contentEl.innerHTML = content.toString()
  } else if (content instanceof HTMLElement) {
    contentEl.appendChild(content)
  }

  modalEl.appendChild(contentEl)

  // 添加底部
  if (footer) {
    const footerEl = document.createElement('div')
    footerEl.style.padding = '16px'
    footerEl.style.borderTop = '1px solid #e8e8e8'
    footerEl.style.textAlign = 'right'

    if (typeof footer === 'object' && !Array.isArray(footer)) {
      const { isOk = true, isCancel = true, okText = '确定', cancelText = '取消' } = footer

      if (isCancel) {
        const cancelButton = document.createElement('button')
        cancelButton.textContent = cancelText
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
    } else if (typeof footer === 'function') {
      footerEl.innerHTML = footer()
    } else if (footer === true) {
      const defaultFooter = document.createElement('div')
      defaultFooter.innerHTML = '<button>取消</button><button>确定</button>'
      footerEl.appendChild(defaultFooter)
    }

    modalEl.appendChild(footerEl)
  }

  // 将模态框添加到容器中
  wrapperEl.appendChild(modalEl)

  // 将容器添加到指定的 DOM 元素中
  const container = getContainer()
  container.appendChild(wrapperEl)

  // 处理 ESC 键关闭
  let handleKeyDown: ((e: KeyboardEvent) => void) | null = null
  if (escClose) {
    handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
  }

  // 关闭模态框
  function closeModal () {
    onCloseEvent?.()
    wrapperEl.remove()
    if (escClose && handleKeyDown) {
      document.removeEventListener('keydown', handleKeyDown)
    }
    onOpenChange?.(false)
  }

  // 返回模态框的相关信息
  return {
    wrapperEl,
    modalKey: `modal-${Date.now()}`,
    props,
    removeEventListenerChangeZIndex: () => {
      if (escClose && handleKeyDown) {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }
}
