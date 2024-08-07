import*as e from"../../../../core/common/common.js";import*as o from"../../../../core/i18n/i18n.js";import"../../../../core/root/root.js";import*as t from"../../legacy.js";const i={flamechartMouseWheelAction:"Flamechart mouse wheel action:",scroll:"Scroll",zoom:"Zoom",liveMemoryAllocationAnnotations:"Live memory allocation annotations",showLiveMemoryAllocation:"Show live memory allocation annotations",hideLiveMemoryAllocation:"Hide live memory allocation annotations",collectGarbage:"Collect garbage"},l=o.i18n.registerUIStrings("ui/legacy/components/perf_ui/perf_ui-meta.ts",i),a=o.i18n.getLazilyComputedLocalizedString.bind(void 0,l);let n;t.ActionRegistration.registerActionExtension({actionId:"components.collect-garbage",category:"PERFORMANCE",title:a(i.collectGarbage),iconClass:"mop",loadActionDelegate:async()=>new((await async function(){return n||(n=await import("./perf_ui.js")),n}()).GCActionDelegate.GCActionDelegate)}),e.Settings.registerSettingExtension({category:"PERFORMANCE",storageType:"Synced",title:a(i.flamechartMouseWheelAction),settingName:"flamechart-mouse-wheel-action",settingType:"enum",defaultValue:"zoom",options:[{title:a(i.scroll),text:a(i.scroll),value:"scroll"},{title:a(i.zoom),text:a(i.zoom),value:"zoom"}]}),e.Settings.registerSettingExtension({category:"MEMORY",experiment:"live-heap-profile",title:a(i.liveMemoryAllocationAnnotations),settingName:"memory-live-heap-profile",settingType:"boolean",defaultValue:!1,options:[{value:!0,title:a(i.showLiveMemoryAllocation)},{value:!1,title:a(i.hideLiveMemoryAllocation)}]});