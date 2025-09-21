# 综合工作台 (Comprehensive Workbench)

![React](https://img.shields.io/badge/React-19-blue?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-blue?logo=tailwindcss) ![Vite](https://img.shields.io/badge/Setup-No_Build-yellow)

一个功能强大、无需后端、完全在浏览器中运行的一体化办公管理平台。

<!-- 建议在此处添加一张应用截图，例如主仪表板的概览图 -->
<!-- ![App Screenshot](https://example.com/screenshot.png) -->

---

## 目录 (Table of Contents)

- [✨ 核心亮点 (Key Features)](#-核心亮点-key-features)
- [🚀 快速开始 (Getting Started)](#-快速开始-getting-started)
- [☁️ 部署指南 (Deployment)](#️-部署指南-deployment)
- [🔒 数据持久化与隐私 (Data Persistence & Privacy)](#-数据持久化与隐私-data-persistence--privacy)
- [🧩 功能模块详解 (Feature Breakdown)](#-功能模块详解-feature-breakdown)
- [🛠️ 技术栈 (Technology Stack)](#️-技术栈-technology-stack)
- [🗺️ 未来路线图 (Roadmap)](#️-未来路线图-roadmap)

---

## ✨ 核心亮点 (Key Features)

*   **⚡️ 完全无后端:** 无需服务器、数据库或网络连接。所有功能均在客户端实现。
*   **📂 本地数据存储:** 您的所有数据都安全地存储在浏览器的 `LocalStorage` 中，确保隐私和离线可用性。
*   **🖥️ 响应式设计:** 界面在桌面和各种尺寸的设备上都能良好显示。
*   **🔗 模块化功能:** 包括导航、出差、会议、引合、合同和基础数据管理。
*   **✍️ 强大的编辑器:** 内置支持实时预览的 Markdown 编辑器，可插入图片并导出为 PDF。
*   **📊 智能数据筛选:** 引合与合同模块具备级联筛选功能，简化数据查找过程。
*   **📤 灵活的数据导入/导出:** 支持 CSV 和原生 Excel (.xlsx) 格式的数据导出，并提供强大的 CSV 数据导入及验证功能。

---

## 🚀 快速开始 (Getting Started)

部署此应用非常简单，因为它只包含静态文件，**不需要任何构建步骤**。

**重要提示:** 由于浏览器的安全策略，您不能直接通过 `file:///...` 协议打开 `index.html`。文件**必须由一个 Web 服务器来提供服务**。

这是在您本地计算机上运行的最简单方法：

1.  **准备文件:** 将所有应用文件放在同一个文件夹中。

2.  **启动本地服务器:** 打开终端，进入该文件夹，并运行以下命令之一：

    *   **如果您有 Python 3:**
        ```bash
        python -m http.server
        ```
    *   **如果您有 Node.js/NPM:**
        ```bash
        npx serve
        ```

3.  **访问应用:** 打开浏览器并访问 [**http://localhost:8000**](http://localhost:8000) (或服务器提示的地址)。

应用现已成功运行！

---

## ☁️ 部署指南 (Deployment)

除了快速开始的方法，您还可以选择以下方式进行部署：

<details>
<summary><strong>方法一: 部署到静态托管服务 (如 Vercel, Netlify)</strong></summary>

<br>
您可以轻松地将此应用免费托管在线上。

1.  **选择一个提供商:** [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/), 或 [GitHub Pages](https://pages.github.com/) 都是绝佳的选择。
2.  **上传文件:** 只需将文件夹中的所有应用文件上传到托管服务。**无需配置“构建命令”**。
3.  **完成:** 该服务会给您一个公开的URL，您可以从任何地方访问您的综合工作台。
<br>
</details>

<details>
<summary><strong>方法二: 使用 Docker 部署 (推荐)</strong></summary>

<br>
使用 Docker 是部署此应用的最佳实践，因为它提供了一个一致、隔离且可移植的运行环境。

**前提条件:** 您的系统上必须已安装 [Docker](https://www.docker.com/get-started)。

1.  **创建配置文件:** 在您的项目文件夹（与 `index.html` 同级）中，创建以下两个新文件：

    **a) `Dockerfile`** (无文件扩展名)
    ```dockerfile
    # 使用轻量级的 Nginx 镜像作为基础
    FROM nginx:alpine

    # 将自定义的 Nginx 配置文件复制到容器中
    # 这个配置是为了支持单页应用（SPA）的路由
    COPY nginx.conf /etc/nginx/conf.d/default.conf

    # 将当前目录下的所有应用文件复制到 Nginx 的网站根目录
    COPY . /usr/share/nginx/html

    # 暴露 80 端口，这是 Nginx 默认监听的端口
    EXPOSE 80

    # 容器启动时，Nginx 会自动在前台运行
    CMD ["nginx", "-g", "daemon off;"]
    ```

    **b) `nginx.conf`**
    ```nginx
    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    ```

2.  **构建 Docker 镜像:**
    ```bash
    docker build -t comprehensive-workbench .
    ```

3.  **运行 Docker 容器:**
    ```bash
    docker run -d -p 8080:80 --name my-workbench comprehensive-workbench
    ```

4.  **访问应用:** 打开浏览器并访问 [**http://localhost:8080**](http://localhost:8080)。
<br>
</details>

---

## 🔒 数据持久化与隐私 (Data Persistence & Privacy)

本应用的核心设计理念是**您的数据完全归您所有**。

*   **存储位置:** 所有数据，包括链接、报告、合同等，都存储在您当前使用的**浏览器的本地存储 (`LocalStorage`)** 中。
*   **隐私:** 任何数据都**不会**被发送到任何外部服务器。它只存在于您的计算机上。
*   **重要提示:**
    *   如果您**清除浏览器缓存或站点数据**，本应用的所有数据都将被**永久删除**。
    *   数据是与**来源 (Origin)** 绑定的。例如，在 `http://localhost:8000` 输入的数据将无法在 `http://localhost:8080` 或其他地址访问。
    *   为了数据安全，建议定期使用各模块的导出功能（导出为 CSV 或 Excel）来**备份您的数据**。

---

## 🧩 功能模块详解 (Feature Breakdown)

<details>
<summary>点击展开/折叠各模块详细功能</summary>

<br>

### **导航与常用链接 (Dashboard)**
- **功能:** 一个可定制的主页，用于存放您最常用的网站和内部系统链接。
- **实现:** 用户可以添加、编辑和删除链接，每个链接都包含标题、URL和简介。数据以现代化的卡片布局进行展示，并包含CSV导出功能。

### **出差管理 (Business Trip Management)**
- **功能:** 从出差申请到差旅报告的完整工作流管理。
- **实现:** 用户可以创建包含目的地、事由等信息的出差申请。出差结束后，可以附上一份详细的报告，涵盖工作成果、遇到的问题及费用情况。

### **会议管理 (Meeting Management)**
- **功能:** 一个功能丰富的、博客风格的界面，用于创建、查看和分享详细的会议纪要。
- **实现:**
  - **Markdown 编辑器:** 拥有一个全屏编辑器，并提供实时的分栏预览功能。
  - **富文本内容:** 支持插入图片（通过将其转换为Base64格式）和从 `.md` 文件导入内容。
  - **PDF 导出:** 可生成专业的、适合打印的A4格式PDF文档，包含适当的页边距和格式。

### **引合记录 (Inquiry Records)**
- **功能:** 一个用于管理详细销售引合或合作记录的强大工具。
- **实现:**
  - **级联筛选:** 拥有一个智能的级联筛选系统。当在一个下拉菜单中选择一个选项时，其他下拉菜单中的选项会智能地缩小范围。
  - **数据联动:** 表单字段会从“基础数据”模块中读取数据并生成下拉菜单，确保数据一致性。
  - **双格式导出:** 支持将筛选后的数据导出为 **CSV 和原生 Excel (.xlsx)** 两种格式。

### **合同管理 (Contract Management)**
- **功能:** 一个专门用于跟踪和管理合同的模块。
- **实现:** 复制了“引合记录”模块的高级功能，包括级联筛选、数据联动以及CSV/Excel双格式导出能力。

### **基础数据 (Master Data)**
- **功能:** 维护所有核心业务数据的中心枢纽。
- **实现:**
  - **数据导入:** 一个强大、统一的CSV导入工具，具备验证逻辑并提供详细反馈。
  - **担当管理:** 管理员工详细信息，并提供智能的区域标签输入。
  - **代理商/产品/客户管理:** 提供完整的增删改查功能。

<br>
</details>

---

## 🛠️ 技术栈 (Technology Stack)

- **前端:** React 19, TypeScript
- **样式:** Tailwind CSS
- **数据存储:** 浏览器本地存储 (通过自定义的 `useLocalStorage` Hook)
- **文档生成:**
  - **Excel:** [SheetJS/xlsx](https://sheetjs.com/)
  - **PDF:** [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)
- **Markdown 渲染:** [react-markdown](https://github.com/remarkjs/react-markdown) & [remark-gfm](https://github.com/remarkjs/remark-gfm)

---

## 🗺️ 未来路线图 (Roadmap)

我们计划在未来添加更多功能，以进一步提升您的生产力：

-   [ ] **数据备份与恢复:** 实现一键导出所有数据到单个加密文件，并能从中恢复。
-   [ ] **主题切换:** 提供浅色/深色模式切换功能。
-   [ ] **PWA 支持:** 将应用转化为渐进式网络应用 (PWA)，以获得更接近原生应用的体验和离线能力。
-   [ ] **高级搜索:** 在所有模块中实现全局搜索功能。
-   [ ] **可定制仪表盘:** 允许用户自定义仪表盘布局和展示的数据小组件。
