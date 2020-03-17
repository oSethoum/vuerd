import { html, customElement, property } from "lit-element";
import { styleMap } from "lit-html/directives/style-map";
import { fromEvent, Observable, Subscription } from "rxjs";
import { EditorElement } from "./EditorElement";
import { defaultWidth, defaultHeight } from "./Layout";
import { Menu, getERDContextmenu } from "@src/core/model/Menu";
import { Bus } from "@src/core/Event";
import { keymapMatch } from "@src/core/Keymap";
import { tableAdd } from "@src/core/command/table";
import "./Canvas";

@customElement("vuerd-erd")
class ERD extends EditorElement {
  @property({ type: Number })
  width = defaultWidth;
  @property({ type: Number })
  height = defaultHeight;
  @property({ type: Boolean })
  contextmenu = false;
  @property({ type: Number })
  contextmenuX = 0;
  @property({ type: Number })
  contextmenuY = 0;

  private contextmenu$!: Observable<MouseEvent>;
  private mousedown$!: Observable<MouseEvent>;
  private subContextmenu!: Subscription;
  private subMousedown!: Subscription;
  private subKeydown!: Subscription;
  private menus: Menu[] = [];

  get theme() {
    return {
      width: `${this.width}px`,
      height: `${this.height}px`
    };
  }

  connectedCallback() {
    super.connectedCallback();
    console.log("ERD before render");
    const { store, eventBus, keymap } = this.context;
    eventBus.on(Bus.ERD.contextmenuEnd, this.onContextmenuEnd);
    this.subKeydown = this.context.windowEventObservable.keydown$.subscribe(
      (event: KeyboardEvent) => {
        const { focus } = store.editorState;
        if (focus) {
          if (keymapMatch(event, keymap.newTable)) {
            store.dispatch(tableAdd(store));
          }
        }
      }
    );
  }
  firstUpdated() {
    console.log("ERD after render");
    const erd = this.renderRoot.querySelector(".vuerd-erd");
    if (erd) {
      this.contextmenu$ = fromEvent<MouseEvent>(erd, "contextmenu");
      this.mousedown$ = fromEvent<MouseEvent>(erd, "mousedown");
      this.subContextmenu = this.contextmenu$.subscribe(this.onContextmenu);
      this.subMousedown = this.mousedown$.subscribe(this.onMousedown);
    }
  }
  disconnectedCallback() {
    console.log("ERD destroy");
    this.subContextmenu.unsubscribe();
    this.subMousedown.unsubscribe();
    this.subKeydown.unsubscribe();
    this.context.eventBus.off(Bus.ERD.contextmenuEnd, this.onContextmenuEnd);
    super.disconnectedCallback();
  }

  render() {
    console.log("ERD render");
    return html`
      <div class="vuerd-erd" style=${styleMap(this.theme)}>
        <vuerd-canvas .context=${this.context}></vuerd-canvas>
        ${this.contextmenu
          ? html`
              <vuerd-contextmenu
                .context=${this.context}
                .menus=${this.menus}
                .x=${this.contextmenuX}
                .y=${this.contextmenuY}
              ></vuerd-contextmenu>
            `
          : ``}
      </div>
    `;
  }

  private onContextmenu = (event: MouseEvent) => {
    event.preventDefault();
    const { store, keymap } = this.context;
    this.menus = getERDContextmenu(store, keymap);
    this.contextmenuX = event.x;
    this.contextmenuY = event.y;
    this.contextmenu = true;
  };

  private onContextmenuEnd = (event: Event) => {
    this.contextmenu = false;
  };
  private onMousedown = (event: MouseEvent) => {
    const el = event.target as HTMLElement;
    if (!el.closest(".vuerd-contextmenu")) {
      this.contextmenu = false;
    }
  };
}
