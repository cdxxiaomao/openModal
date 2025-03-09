import { render, h, type VNode } from 'vue' // 导入 Vue 的 render 和 h 函数
import { openModal, type OpenModalProps, type ModalMapItem } from './openModal' // 导入原始的 openModal 方法

/**
 * 扩展的 openVueModal 方法，支持 Vue 的 h 函数渲染
 * @param props 模态框的配置
 * @returns ModalMapItem
 */
export function openVueModal (props: OpenModalProps & { content: VNode | (() => VNode) }): ModalMapItem {
  // 创建一个容器元素，用于挂载 Vue 的 VNode
  const contentContainer = document.createElement('div')

  // 渲染 Vue 的 VNode 到容器中
  const renderContent = () => {
    const content = typeof props.content === 'function' ? props.content() : props.content
    render(content, contentContainer)
  }

  // 调用原始的 openModal 方法
  const modal = openModal({
    ...props,
    content: '' // 清空 content，避免直接渲染 [object HTMLDivElement]
  })

  // 将 contentContainer 插入模态框的内容区域
  const modalContentEl = modal.wrapperEl.querySelector('.modal-content') // 假设模态框内容区域的类名为 .modal-content
  if (modalContentEl) {
    modalContentEl.appendChild(contentContainer)
  }

  // 初始渲染
  renderContent()

  // 返回模态框的相关信息
  return modal
}
