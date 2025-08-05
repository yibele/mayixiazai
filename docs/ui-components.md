# design UI框架与组件库规范

## 1. 概述

本文档定义了“蚂蚁下载”小程序项目所采用的UI框架及其可用的组件。为确保项目的一致性和稳定性，所有开发人员（包括AI助手）必须严格遵守此规范。

- **UI框架版本**: v1.10.0

## 2. 可用组件列表

开发过程中 **必须且只能** 使用以下列表中的组件。任何超出此范围的组件使用都将被视为违反规范。

### 基础组件 (Basic)

| 组件 (Component) | 中文名称 |
| :--- | :--- |
| `Button` | 按钮 |
| `Divider` | 分割线 |
| `Fab` | 悬浮按钮 |
| `Icon` | 图标 |
| `Layout` | 布局 |
| `Link` | 链接 |

### 导航组件 (Navigation)

| 组件 (Component) | 中文名称 |
| :--- | :--- |
| `BackTop` | 返回顶部 |
| `Drawer` | 抽屉 |
| `Indexes` | 索引 |
| `Navbar` | 导航条 |
| `SideBar` | 侧边导航栏 |
| `Steps` | 步骤条 |
| `TabBar` | 标签栏 |
| `Tabs` | 选项卡 |

### 输入组件 (Input)

| 组件 (Component) | 中文名称 |
| :--- | :--- |
| `Calendar` | 日历 |
| `Cascader` | 级联选择器 |
| `CheckBox` | 多选框 |
| `ColorPicker` | 颜色选择器 |
| `DateTimePicker` | 日期选择器 |
| `Input` | 输入框 |
| `Picker` | 选择器 |
| `Radio` | 单选框 |
| `Rate` | 评分 |
| `Search` | 搜索框 |
| `Slider` | 滑动选择器 |
| `Stepper` | 步进器 |
| `Switch` | 开关 |
| `Textarea` | 多行文本框 |
| `TreeSelect` | 树形选择 |
| `Upload` | 上传 |

### 数据展示组件 (Data Display)

| 组件 (Component) | 中文名称 |
| :--- | :--- |
| `Avatar` | 头像 |
| `Badge` | 徽章 |
| `Cell` | 单元格 |
| `Collapse` | 折叠面板 |
| `CountDown` | 倒计时 |
| `Empty` | 空状态 |
| `Footer` | 页脚 |
| `Grid` | 宫格 |
| `Image` | 图片 |
| `ImageViewer` | 图片预览 |
| `Progress` | 进度条 |
| `QRCode` | 二维码 |
| `Result` | 结果 |
| `Skeleton` | 骨架屏 |
| `Sticky` | 吸顶容器 |
| `Swiper` | 轮播图 |
| `Tag` | 标签 |

### 反馈组件 (Feedback)

| 组件 (Component) | 中文名称 |
| :--- | :--- |
| `ActionSheet` | 动作面板 |
| `Dialog` | 对话框 |
| `DropdownMenu` | 下拉菜单 |
| `Guide` | 引导 |
| `Loading` | 加载 |
| `Message` | 全局提示 |
| `NoticeBar` | 消息提醒 |
| `Overlay` | 遮罩层 |
| `Popup` | 弹出层 |
| `PullDownRefresh` | 下拉刷新 |
| `SwipeCell` | 滑动操作 |
| `Toast` | 轻提示 |

---

**开发注意**: 严禁使用此列表之外的任何组件，以避免因版本不匹配导致的功能异常或编译错误。
