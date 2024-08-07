import*as e from"../helpers/helpers.js";import*as t from"../../lit-html/lit-html.js";const o=new CSSStyleSheet;o.replaceSync(":host{display:block}h1{font-weight:normal;font-size:18px;line-height:28px;padding:0;margin-top:0;color:var(--sys-color-on-surface)}.intro-steps{counter-reset:custom-counter;list-style:none;margin:16px 0 30px 30px;padding:0}.intro-steps li{color:var(--sys-color-on-surface);counter-increment:custom-counter;font-size:13px;letter-spacing:0.03em;line-height:1.54;margin-bottom:9px;position:relative}.intro-steps li::before{--override-color-counter-background:var(--sys-color-tonal-container);box-sizing:border-box;background:var(--override-color-counter-background);border-radius:50%;color:var(--sys-color-primary);content:counter(custom-counter);font-size:12px;height:18px;left:-30px;line-height:20px;position:absolute;text-align:center;top:0;width:18px;display:flex;align-items:center;justify-content:center}\n/*# sourceURL=panelIntroductionSteps.css */\n");class s extends HTMLElement{static litTagName=t.literal`devtools-panel-introduction-steps`;#e=this.attachShadow({mode:"open"});#t=this.#o.bind(this);connectedCallback(){this.#e.adoptedStyleSheets=[o],e.ScheduledRender.scheduleRender(this,this.#t)}#o(){if(!e.ScheduledRender.isScheduledRender(this))throw new Error("FeedbackButton render was not scheduled");t.render(t.html`
      <h1><slot name="title">slot: title</slot></h1>

      <ol class="intro-steps">
        <li><slot name="step-1">slot: step-1</slot></li>
        <li><slot name="step-2">slot: step-2</slot></li>
        <li><slot name="step-3">slot: step-3</slot></li>
      </ol>
    `,this.#e,{host:this})}}customElements.define("devtools-panel-introduction-steps",s);var n=Object.freeze({__proto__:null,PanelIntroductionSteps:s});export{n as PanelIntroductionSteps};