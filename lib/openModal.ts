import { dragElement } from 'poohou-drag-element'
import { useResizeElement } from 'poohou-resize-element'

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
  /** 自定义关闭按钮，支持字符串、数字、HTML元素或返回HTML元素的函数 */
  closeButton?: RenderType
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
  modalEl.style.transform = 'scale(0.5)' // 关闭时缩小
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
    zoomFromMouse,
    closeButton
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
  wrapperEl.style.display = 'flex' // 新增：设置外部盒子为 flex 布局
  wrapperEl.style.justifyContent = 'center'
  wrapperEl.style.alignItems = 'center'
  wrapperEl.style.transition = 'background-color 0.3s ease'
  wrapperEl.style.pointerEvents = isOpenMore ? 'none' : 'auto' // 新增：当 isOpenMore 为 true 时，禁用点击事件

  const modalEl = document.createElement('div')
  modalEl.style.width = isFullScreen ? '100%' : (typeof width === 'number' ? `${width}px` : width)
  modalEl.style.height = isFullScreen ? '100%' : (typeof height === 'number' ? `${height}px` : height)
  modalEl.style.backgroundColor = '#fff'
  modalEl.style.borderRadius = '4px'
  modalEl.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
  modalEl.style.position = 'absolute'
  modalEl.style.left = isFullScreen ? '0' : `${mouseX}px`
  modalEl.style.top = isFullScreen ? '0' : `${mouseY}px`
  modalEl.style.transformOrigin = 'center'
  modalEl.style.transition = '0.2s'
  modalEl.style.opacity = '0'
  modalEl.style.transform = 'scale(0.5)' // 初始时从点击位置或中间缩放
  modalEl.style.pointerEvents = 'auto' // 新增：确保模态框内部可以点击
  modalEl.style.display = 'flex' // 新增：设置模态框为 flex 布局
  modalEl.style.flexDirection = 'column' // 新增：设置 flex 方向为列

  const titleEl = document.createElement('div')
  titleEl.style.padding = '16px'
  titleEl.style.borderBottom = '1px solid #e8e8e8'
  titleEl.style.fontSize = '16px'
  titleEl.style.fontWeight = 'bold'
  titleEl.style.display = 'flex' // 修改：设置为 flex 布局
  titleEl.style.justifyContent = 'space-between'
  titleEl.style.alignItems = 'center'

  // 新增：渲染 title 内容
  if (typeof title === 'string' || typeof title === 'number') {
    const titleContentEl = document.createElement('span')
    titleContentEl.textContent = title.toString()
    titleEl.appendChild(titleContentEl)
  } else if (title instanceof HTMLElement) {
    titleEl.appendChild(title)
  } else if (typeof title === 'function') {
    const renderedTitle = title(() => document.createElement('span'))
    titleEl.appendChild(renderedTitle)
  }

  const buttonGroupEl = document.createElement('div') // 新增：按钮组容器
  buttonGroupEl.style.display = 'flex'
  buttonGroupEl.style.alignItems = 'center'
  buttonGroupEl.style.gap = '8px' // 设置按钮间距

  // 全屏按钮样式调整
  const fullScreenButtonEl = document.createElement('div')
  fullScreenButtonEl.style.cursor = 'pointer'
  fullScreenButtonEl.style.fontSize = '20px'
  fullScreenButtonEl.style.userSelect = 'none'
  fullScreenButtonEl.style.padding = '4px 8px' // 添加内边距
  fullScreenButtonEl.style.borderRadius = '4px' // 圆角
  fullScreenButtonEl.style.backgroundColor = 'transparent' // 默认背景透明
  fullScreenButtonEl.style.transition = 'background-color 0.2s ease' // 添加过渡效果
  fullScreenButtonEl.innerHTML = '⛶' // 初始图标为全屏

  // 鼠标移入和点击时的背景颜色变化
  fullScreenButtonEl.onmouseenter = () => {
    fullScreenButtonEl.style.backgroundColor = '#f0f0f0'
  }
  fullScreenButtonEl.onmouseleave = () => {
    fullScreenButtonEl.style.backgroundColor = 'transparent'
  }
  fullScreenButtonEl.onclick = () => {
    fullScreenButtonEl.style.backgroundColor = '#d9d9d9' // 点击时背景变深
    setTimeout(() => {
      fullScreenButtonEl.style.backgroundColor = '#f0f0f0' // 恢复移入状态
    }, 200)
    toggleFullScreen(modalEl)
  }

  // 关闭按钮样式调整
  const closeButtonEl = document.createElement('div')
  closeButtonEl.style.cursor = 'pointer'
  closeButtonEl.style.fontSize = '20px'
  closeButtonEl.style.userSelect = 'none'
  closeButtonEl.style.padding = '4px 8px' // 添加内边距
  closeButtonEl.style.borderRadius = '4px' // 圆角
  closeButtonEl.style.backgroundColor = 'transparent' // 默认背景透明
  closeButtonEl.style.transition = 'background-color 0.2s ease' // 添加过渡效果
  closeButtonEl.innerHTML = '×'

  // 鼠标移入和点击时的背景颜色变化
  closeButtonEl.onmouseenter = () => {
    closeButtonEl.style.backgroundColor = '#f0f0f0'
  }
  closeButtonEl.onmouseleave = () => {
    closeButtonEl.style.backgroundColor = 'transparent'
  }
  closeButtonEl.onclick = () => {
    closeButtonEl.style.backgroundColor = '#d9d9d9' // 点击时背景变深
    setTimeout(() => {
      closeButtonEl.style.backgroundColor = '#f0f0f0' // 恢复移入状态
    }, 200)
    closeModal()
  }

  // 将按钮添加到按钮组容器
  buttonGroupEl.appendChild(fullScreenButtonEl)
  buttonGroupEl.appendChild(closeButtonEl)

  // 将按钮组容器添加到标题栏
  titleEl.appendChild(buttonGroupEl)

  // 新增：双击头部全屏与还原
  titleEl.ondblclick = () => {
    toggleFullScreen(modalEl)
  }

  let originalLeft: string, originalTop: string

  // 在模态框初始化时记录默认的居中位置
  setTimeout(() => {
    modalEl.style.transform = 'scale(1)' // 在加载完成后，平滑地缩放至原始大小
    modalEl.style.opacity = '1'
    // 记录默认的居中位置
    originalLeft = (Number(mouseX) / 2).toString() + 'px'
    originalTop = (Number(mouseY) / 2).toString() + 'px'
  }, 0)

  // 新增：切换全屏函数
  function toggleFullScreen (modalEl: HTMLElement) {
    if (processedProps.isFullScreen) {
      // 取消全屏时恢复默认的居中位置
      modalEl.style.left = originalLeft
      modalEl.style.top = originalTop
      modalEl.style.width = typeof width === 'number' ? `${width}px` : width
      modalEl.style.height = typeof height === 'number' ? `${height}px` : height
      fullScreenButtonEl.innerHTML = '⛶' // 切换图标为全屏
    } else {
      originalLeft = modalEl.style.left
      originalTop = modalEl.style.top
      // 全屏时不记录当前位置
      modalEl.style.width = '100%'
      modalEl.style.height = '100%'
      modalEl.style.left = '0'
      modalEl.style.top = '0'
      fullScreenButtonEl.innerHTML = '⛿' // 切换图标为取消全屏
    }
    processedProps.isFullScreen = !processedProps.isFullScreen // 确保状态正确更新
  }

  if (closeButton) {
    if (typeof closeButton === 'string' || typeof closeButton === 'number') {
      closeButtonEl.innerHTML = closeButton.toString()
    } else if (closeButton instanceof HTMLElement) {
      closeButtonEl.appendChild(closeButton)
    } else if (typeof closeButton === 'function') {
      closeButtonEl.appendChild(closeButton())
    }
  } else {
    closeButtonEl.innerHTML = '×'
  }

  closeButtonEl.onclick = () => {
    closeModal()
  }

  titleEl.appendChild(fullScreenButtonEl) // 新增：将全屏按钮添加到标题栏
  titleEl.appendChild(closeButtonEl)
  modalEl.appendChild(titleEl)

  dragElement(modalEl, {
    reference: 'window',
    handle: [titleEl],
    onDragStart: () => {
      modalEl.style.transition = 'none' // 拖动开始时移除过渡效果
    },
    onDragEnd: () => {
      modalEl.style.transition = '0.2s' // 拖动结束后恢复过渡效果
    }
  })

  setTimeout(() => {
    useResizeElement(modalEl, {
      isFixed: true,
      showOnHover: false,
      position: ['top', 'left', 'bottom-left', 'bottom-right', 'bottom', 'top-left', 'top-right', 'right'],
      showHandleStyle: false
    })
  }, 500)

  const contentEl = document.createElement('div')
  contentEl.className = 'modal-content'
  contentEl.style.padding = '16px'
  contentEl.style.overflow = 'auto' // 新增：允许内容区域滚动
  contentEl.style.flex = '1' // 修改：使用 flex 布局来控制内容区域的高度
  contentEl.style.display = 'flex' // 新增：使用 flex 布局
  contentEl.style.flexDirection = 'column' // 新增：设置 flex 方向为列

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

// 新增：关闭所有模态框的函数
export function closeAllModals () {
  // 复制 modalStore 数组，避免直接操作原数组
  const modalsToClose = [...modalStore]
  modalsToClose.forEach(modalItem => {
    closeModalFunction(modalItem)
  })
}
