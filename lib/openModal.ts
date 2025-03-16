import { dragElement } from 'poohou-drag-element'

// 类型定义
type RenderType = string | number | HTMLElement | ((h: () => HTMLElement) => HTMLElement)
type ModeType = 'modal' | 'drawer'

interface OpenModalProps {
  /** 模态框标题，支持字符串、数字、HTML元素或返回HTML元素的函数 */
  title: RenderType
  /** 模态框模式，支持 'modal' 或 'drawer'，默认为 'modal' */
  mode?: ModeType
  /** 模态框宽度，支持字符串或数字，默认为 '50%' */
  width?: string | number
  /** 模态框高度，支持字符串或数字，默认为 'auto' */
  height?: number | string
  /** 模态框的 z-index 值，默认为 1000 */
  zIndex?: number
  /** 是否全屏显示模态框，默认为 false */
  isFullScreen?: boolean
  /** 获取模态框的容器元素，默认为 document.body */
  getContainer?: () => HTMLElement
  /** 模态框关闭时的回调函数 */
  onCloseEvent?: () => void
  /** 模态框内容，支持字符串、数字、HTML元素或返回HTML元素的函数 */
  content?: RenderType
  /** 是否支持多开窗口，默认为 false */
  isOpenMore?: boolean
  /** 是否显示遮罩层，默认为 true */
  mask?: boolean
  /** 是否支持按 ESC 键关闭模态框，默认为 true */
  escClose?: boolean
  /** 模态框底部配置，支持对象、布尔值或自定义内容 */
  footer?: {
    /** 是否显示继续按钮 */
    isContinue?: boolean
    /** 是否显示确定按钮 */
    isOk?: boolean
    /** 是否显示取消按钮 */
    isCancel?: boolean
    /** 取消按钮的文本 */
    canText?: string | number
    /** 确定按钮的文本 */
    okText?: string | number
    /** 确定按钮是否禁用 */
    okDisabled?: boolean
    /** 底部左侧内容 */
    footerLeft?: RenderType
    /** 底部中间按钮内容 */
    footerButtonCenter?: RenderType
    /** 底部右侧内容 */
    footerRight?: RenderType
  } | boolean | RenderType
  /** 模态框显示状态变化的回调函数 */
  visibleChange?: (visible: boolean) => void
  /** 取消按钮点击时的回调函数 */
  onCancel?: () => Promise<void> | void
  /** 确定按钮点击时的回调函数 */
  onOk?: () => Promise<void> | void
  /** 抽屉模式的弹出位置，支持 'top'、'right'、'bottom'、'left'，默认为 'right' */
  placement?: 'top' | 'right' | 'bottom' | 'left'
  /** 是否支持调整模态框大小，默认为 false */
  isResize?: boolean
  /** 调整大小的配置项 */
  resizeOptions?: Record<string, any>
  /** 模态框打开状态变化的回调函数 */
  onOpenChange?: (status: boolean) => void
  /** 是否从鼠标点击位置开始缩放模态框，默认为 false */
  zoomFromMouse?: boolean
}

interface ModalMapItem {
  wrapperEl: HTMLElement
  modalKey: string
  props: OpenModalProps
  removeEventListenerChangeZIndex: () => void
}

const modalStore: ModalMapItem[] = [] // 用于保存所有打开的窗口

// 外部统一的键盘事件监听器
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    // 获取当前前置的窗口
    const topModal = modalStore[modalStore.length - 1]

    if (topModal && (topModal.props.escClose ?? true)) {
      // 关闭当前前置的窗口
      closeModalFunction(topModal)
    }
  }
}

// 在模块加载时添加全局键盘事件监听器
document.addEventListener('keydown', handleKeyDown)

// 将关闭逻辑提取为一个函数
const closeModalFunction = (modalItem: ModalMapItem) => {
  if (!modalItem.props.isOpenMore && modalItem.props.mask) {
    modalItem.wrapperEl.style.transition = 'background-color 0.3s ease' // 添加背景透明度渐变
    modalItem.wrapperEl.style.backgroundColor = 'rgba(0, 0, 0, 0)' // 关闭时，mask 透明度渐变为 0
  }
  const modalEl = modalItem.wrapperEl.querySelector('div') as HTMLElement
  modalEl.style.transform = 'scale(0)' // 关闭时缩小
  modalEl.style.opacity = '0'

  setTimeout(() => {
    modalItem.props.onCloseEvent?.()
    modalItem.wrapperEl.remove()
    modalStore.pop() // 从 modalStore 中移除已关闭的窗口
    modalItem.props.onOpenChange?.(false)
  }, 300)
}

export function openModal (props: OpenModalProps): ModalMapItem {
  // 处理默认值
  const processedProps = {
    mode: 'modal',
    width: '50%',
    height: 'auto',
    zIndex: 1000,
    isFullScreen: false,
    getContainer: () => document.body,
    isOpenMore: false,
    mask: !props.isOpenMore, // 修改：当 isOpenMore 为 true 时，默认 mask 为 false
    escClose: true,
    footer: true,
    placement: 'right',
    isResize: false,
    resizeOptions: {},
    zoomFromMouse: false,
    ...props // 用户传入的 props 会覆盖默认值
  }

  const {
    title,
    mode,
    width,
    height,
    zIndex,
    isFullScreen,
    getContainer,
    onCloseEvent,
    content,
    isOpenMore,
    mask,
    escClose,
    footer,
    visibleChange,
    onCancel,
    onOk,
    placement,
    isResize,
    resizeOptions,
    onOpenChange,
    zoomFromMouse
  } = processedProps

  const mouseX = zoomFromMouse ? (window.event?.clientX || window.innerWidth / 2) : window.innerWidth / 2
  const mouseY = zoomFromMouse ? (window.event?.clientY || window.innerHeight / 2) : window.innerHeight / 2

  const wrapperEl = document.createElement('div')
  wrapperEl.style.position = 'fixed'
  wrapperEl.style.top = '0'
  wrapperEl.style.left = '0'
  wrapperEl.style.width = '100%'
  wrapperEl.style.height = '100%'
  wrapperEl.style.zIndex = (zIndex + modalStore.length).toString() // 修改：为新窗口设置更高的 z-index
  wrapperEl.style.display = 'flex'
  wrapperEl.style.justifyContent = 'center'
  wrapperEl.style.alignItems = 'center'
  wrapperEl.style.transition = 'background-color 0.3s ease'
  wrapperEl.style.pointerEvents = isOpenMore ? 'none' : 'auto' // 新增：当 isOpenMore 为 true 时，禁用点击事件

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
  modalEl.style.transform = 'scale(0)' // 初始时从点击位置或中间缩放
  modalEl.style.pointerEvents = 'auto' // 新增：确保模态框内部可以点击

  const titleEl = document.createElement('div')
  titleEl.style.padding = '16px'
  titleEl.style.borderBottom = '1px solid #e8e8e8'
  titleEl.style.fontSize = '16px'
  titleEl.style.fontWeight = 'bold'
  titleEl.textContent = typeof title === 'function' ? title() : title.toString()
  modalEl.appendChild(titleEl)

  dragElement(modalEl, {
    reference: 'window',
    handle: [titleEl]
  })

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

  if (!isOpenMore && mask) {
    setTimeout(() => {
      wrapperEl.style.backgroundColor = 'rgba(0, 0, 0, 0.5)' // 显示 mask
    }, 0)
  }

  modalStore.push({
    wrapperEl,
    modalKey: `modal-${Date.now()}`,
    props: processedProps, // 使用处理后的 props
    removeEventListenerChangeZIndex: () => {
      modalEl.addEventListener('click', () => {
        modalStore.forEach(item => {
          item.wrapperEl.style.zIndex = (zIndex + modalStore.indexOf(item)).toString()
        })
        wrapperEl.style.zIndex = (zIndex + modalStore.length).toString()
      })
    }
  })

  // 为每个弹窗添加点击事件，确保点击时前置
  modalEl.addEventListener('mousedown', () => {
    // 如果 mask 为 true，则不进行前置操作
    if (!mask) {
      // 将当前窗口移动到 modalStore 数组的末尾，确保它成为前置窗口
      const currentIndex = modalStore.findIndex(item => item.wrapperEl === wrapperEl)
      if (currentIndex !== -1) {
        const [currentModal] = modalStore.splice(currentIndex, 1)
        modalStore.push(currentModal)
      }

      modalStore.forEach(item => {
        item.wrapperEl.style.zIndex = (zIndex + modalStore.indexOf(item)).toString() // 修改：其他窗口 z-index 恢复
      })
      wrapperEl.style.zIndex = (zIndex + modalStore.length).toString() // 修改：当前点击窗口置顶
    }
  })

  setTimeout(() => {
    modalEl.style.left = `${mouseX - modalEl.offsetWidth / 2}px` // 使用 left 定位
    modalEl.style.top = `${mouseY - modalEl.offsetHeight / 2}px` // 使用 top 定位
    modalEl.style.transform = 'scale(1)' // 在加载完成后，平滑地缩放至原始大小
    modalEl.style.opacity = '1'
  }, 0)

  function closeModal () {
    const topModal = modalStore[modalStore.length - 1]
    if (topModal) {
      closeModalFunction(topModal)
    }
  }

  return {
    wrapperEl,
    modalKey: `modal-${Date.now()}`,
    props: processedProps, // 使用处理后的 props
    removeEventListenerChangeZIndex: () => {}
  }
}
