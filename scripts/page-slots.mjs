/**
 * 补充模块「可插入位置」注册表（2026-10-17）
 *
 * 一处维护，两处使用：
 *   1. build.mjs 用它在页面相应位置渲染补充模块；
 *   2. 构建时用它自动生成 static/admin/config.yml 里的「显示位置」下拉选项。
 *
 * 以后新增一个页面段落 / 模块时：在对应页面的 items 里加一条插槽，
 * 再在 layout 函数里调用 slotGroup(data, '页面key', '插槽id')。构建后后台下拉会自动多一个位置。
 *
 * top / bottom 单位 px：
 *   top    = 插槽组上方的留白（由上一个段落的内边距不足时补足）
 *   bottom = 组内最后一条的下内边距（下一个段落自己有上内边距时填 0；否则填 56）
 */
export const PAGE_SLOTS = {
  home: {
    defaultSlot: 'after-products',
    items: [
      // 公告条自身 margin-bottom 10px → 补 46px，合计 56px
      { id: 'after-announce', label: '首屏/公告条下面、简介上面', top: 46, bottom: 0 },
      { id: 'after-intro', label: '简介下面、主产品区上面', top: 0, bottom: 0 },
      { id: 'after-products', label: '主产品区下面、Clients 上面（现在的位置）', top: 0, bottom: 56 },
      { id: 'after-clients', label: 'Clients 下面、页脚上面', top: 0, bottom: 56 },
    ],
  },
  feather: {
    defaultSlot: 'after-applications',
    items: [
      { id: 'after-badge', label: '页面标题下面、产品卡上面', top: 56, bottom: 0 },
      { id: 'after-products', label: '产品卡下面、应用场景上面', top: 0, bottom: 56 },
      { id: 'after-applications', label: '应用场景下面、优势条上面（现在的位置）', top: 0, bottom: 56 },
      { id: 'after-benefits', label: '优势条下面、页脚上面', top: 0, bottom: 56 },
    ],
  },
  banner: {
    defaultSlot: 'after-products',
    items: [
      { id: 'after-hero', label: '标语下面、产品卡上面', top: 30, bottom: 0 },
      { id: 'after-products', label: '产品卡下面、优势条上面（现在的位置）', top: 0, bottom: 56 },
      { id: 'after-benefits', label: '优势条下面、页脚上面', top: 0, bottom: 56 },
    ],
  },
  specgrid: {
    defaultSlot: 'after-products',
    items: [
      { id: 'after-hero', label: '页面标题下面、产品卡上面', top: 30, bottom: 0 },
      { id: 'after-products', label: '产品卡下面、优势条上面（现在的位置）', top: 0, bottom: 56 },
      { id: 'after-benefits', label: '优势条下面、页脚上面', top: 0, bottom: 56 },
    ],
  },
  national: {
    defaultSlot: 'after-size',
    items: [
      { id: 'after-hero', label: '标语下面、产品卡上面（现在的位置）', top: 2, bottom: 0 },
      { id: 'after-products', label: '6 张产品卡下面、Production Options 上面', top: 56, bottom: 0 },
      { id: 'after-options', label: 'Production Options 下面、Choose Your Flag Size 上面', top: 0, bottom: 56 },
      { id: 'after-size', label: 'Choose Your Flag Size 下面、Why Source 上面', top: 0, bottom: 56 },
      { id: 'after-benefits', label: 'Why Source 下面、页脚上面', top: 0, bottom: 56 },
    ],
  },
};
