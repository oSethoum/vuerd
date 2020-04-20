import { html, customElement, property } from "lit-element";
import { classMap } from "lit-html/directives/class-map";
import { Subscription } from "rxjs";
import { EditorElement } from "../EditorElement";
import { Logger } from "@src/core/Logger";
import { SIZE_MIN_WIDTH } from "@src/core/Layout";
import { Column as ColumnModel } from "@src/core/store/Table";
import { selectTable } from "@src/core/command/table";
import {
  editEndTable,
  focusTargetColumn,
  editTable as editTableCommand,
  draggableColumn,
  draggableEndColumn,
} from "@src/core/command/editor";
import {
  changeColumnNotNull,
  removeColumn,
  changeColumnName,
  changeColumnComment,
  changeColumnDataType,
  changeColumnDefault,
} from "@src/core/command/column";
import { FocusType } from "@src/core/model/FocusTableModel";
import { keymapOptionToString } from "@src/core/Keymap";

@customElement("vuerd-column")
class Column extends EditorElement {
  @property({ type: Boolean })
  select = false;
  @property({ type: Boolean })
  draggable = false;
  @property({ type: Boolean })
  focusName = false;
  @property({ type: Boolean })
  focusDataType = false;
  @property({ type: Boolean })
  focusNotNull = false;
  @property({ type: Boolean })
  focusDefault = false;
  @property({ type: Boolean })
  focusComment = false;
  @property({ type: Boolean })
  editName = false;
  @property({ type: Boolean })
  editDataType = false;
  @property({ type: Boolean })
  editDefault = false;
  @property({ type: Boolean })
  editComment = false;
  @property({ type: Number })
  widthName = SIZE_MIN_WIDTH;
  @property({ type: Number })
  widthDataType = SIZE_MIN_WIDTH;
  @property({ type: Number })
  widthNotNull = SIZE_MIN_WIDTH;
  @property({ type: Number })
  widthDefault = SIZE_MIN_WIDTH;
  @property({ type: Number })
  widthComment = SIZE_MIN_WIDTH;

  tableId!: string;
  column!: ColumnModel;

  private subscriptionList: Subscription[] = [];

  connectedCallback() {
    super.connectedCallback();
    const { store } = this.context;
    this.subscriptionList.push.apply(this.subscriptionList, [
      store.observe(this.column, () => this.requestUpdate()),
      store.observe(this.column.ui, name => {
        switch (name) {
          case "widthName":
          case "widthComment":
          case "widthDataType":
          case "widthDefault":
            this.dispatchEvent(new CustomEvent("request-update"));
            break;
        }
      }),
    ]);
  }
  disconnectedCallback() {
    this.subscriptionList.forEach(sub => sub.unsubscribe());
    super.disconnectedCallback();
  }

  render() {
    const { keymap } = this.context;
    const { show } = this.context.store.canvasState;
    const keymapRemoveColumn = keymapOptionToString(keymap.removeColumn[0]);
    return html`
      <li
        class=${classMap({
          "vuerd-column": true,
          select: this.select,
          draggable: this.draggable,
        })}
        data-id=${this.column.id}
        draggable="true"
        @dragstart=${this.onDragstart}
        @dragend=${this.onDragend}
        @dragover=${this.onDragover}
      >
        <vuerd-column-key
          .context=${this.context}
          .columnUI=${this.column.ui}
        ></vuerd-column-key>
        <vuerd-input-edit
          .context=${this.context}
          .width=${this.widthName}
          .value=${this.column.name}
          .focusState=${this.focusName}
          .edit=${this.editName}
          .select=${this.select}
          placeholder="column"
          @blur=${this.onBlur}
          @input=${(event: InputEvent) => this.onInput(event, "columnName")}
          @mousedown=${(event: MouseEvent) => this.onFocus(event, "columnName")}
          @dblclick=${(event: MouseEvent) => this.onEdit(event, "columnName")}
        ></vuerd-input-edit>
        ${show.columnDataType
          ? html`
              <vuerd-column-data-type
                .context=${this.context}
                .width=${this.widthDataType}
                .value=${this.column.dataType}
                .focusState=${this.focusDataType}
                .edit=${this.editDataType}
                .select=${this.select}
                .tableId=${this.tableId}
                .columnId=${this.column.id}
                @blur=${this.onBlur}
                @input=${(event: InputEvent) =>
                  this.onInput(event, "columnDataType")}
                @mousedown=${(event: MouseEvent) =>
                  this.onFocus(event, "columnDataType")}
                @dblclick=${(event: MouseEvent) =>
                  this.onEdit(event, "columnDataType")}
              ></vuerd-column-data-type>
            `
          : ""}
        ${show.columnNotNull
          ? html`
              <vuerd-column-not-null
                .context=${this.context}
                .columnOption=${this.column.option}
                .focusState=${this.focusNotNull}
                @mousedown=${(event: MouseEvent) =>
                  this.onFocus(event, "columnNotNull")}
                @dblclick=${(event: MouseEvent) =>
                  this.onEdit(event, "columnNotNull")}
              ></vuerd-column-not-null>
            `
          : ""}
        ${show.columnDefault
          ? html`
              <vuerd-input-edit
                .context=${this.context}
                .width=${this.widthDefault}
                .value=${this.column.default}
                .focusState=${this.focusDefault}
                .edit=${this.editDefault}
                .select=${this.select}
                placeholder="default"
                @blur=${this.onBlur}
                @input=${(event: InputEvent) =>
                  this.onInput(event, "columnDefault")}
                @mousedown=${(event: MouseEvent) =>
                  this.onFocus(event, "columnDefault")}
                @dblclick=${(event: MouseEvent) =>
                  this.onEdit(event, "columnDefault")}
              ></vuerd-input-edit>
            `
          : ""}
        ${show.columnComment
          ? html`
              <vuerd-input-edit
                .context=${this.context}
                .width=${this.widthComment}
                .value=${this.column.comment}
                .focusState=${this.focusComment}
                .edit=${this.editComment}
                .select=${this.select}
                placeholder="comment"
                @blur=${this.onBlur}
                @input=${(event: InputEvent) =>
                  this.onInput(event, "columnComment")}
                @mousedown=${(event: MouseEvent) =>
                  this.onFocus(event, "columnComment")}
                @dblclick=${(event: MouseEvent) =>
                  this.onEdit(event, "columnComment")}
              ></vuerd-input-edit>
            `
          : ""}
        <vuerd-fontawesome
          class="vuerd-button"
          .context=${this.context}
          title=${keymapRemoveColumn}
          icon="times"
          size="9"
          @click=${this.onRemoveColumn}
        ></vuerd-fontawesome>
      </li>
    `;
  }

  private onInput(event: InputEvent, focusType: FocusType) {
    Logger.debug(`Column onInput: ${focusType}`);
    const { store, helper } = this.context;
    const input = event.target as HTMLInputElement;
    switch (focusType) {
      case "columnName":
        store.dispatch(
          changeColumnName(helper, this.tableId, this.column.id, input.value)
        );
        break;
      case "columnComment":
        store.dispatch(
          changeColumnComment(helper, this.tableId, this.column.id, input.value)
        );
        break;
      case "columnDataType":
        store.dispatch(
          changeColumnDataType(
            helper,
            this.tableId,
            this.column.id,
            input.value
          )
        );
        break;
      case "columnDefault":
        store.dispatch(
          changeColumnDefault(helper, this.tableId, this.column.id, input.value)
        );
        break;
    }
  }
  private onBlur(event: Event) {
    const { store } = this.context;
    store.dispatch(editEndTable());
  }
  private onFocus(event: MouseEvent | TouchEvent, focusType: FocusType) {
    Logger.debug(`Column onFocus: ${focusType}`);
    const { store } = this.context;
    const { editTable, focusTable } = store.editorState;
    if (
      editTable === null ||
      editTable.focusType !== focusType ||
      focusTable === null ||
      focusTable.currentFocusId !== this.column.id
    ) {
      store.dispatch(
        selectTable(store, event.ctrlKey, this.tableId),
        focusTargetColumn(
          this.column.id,
          focusType,
          event.ctrlKey,
          event.shiftKey
        )
      );
    }
  }
  private onEdit(event: MouseEvent, focusType: FocusType) {
    const { store } = this.context;
    const { editTable, focusTable } = store.editorState;
    if (focusTable !== null && editTable === null) {
      if (focusType === "columnNotNull") {
        store.dispatch(
          changeColumnNotNull(store, this.tableId, this.column.id)
        );
      } else {
        store.dispatch(editTableCommand(this.column.id, focusType));
      }
    }
  }
  private onRemoveColumn(event: MouseEvent) {
    const { store } = this.context;
    store.dispatch(removeColumn(this.tableId, [this.column.id]));
  }
  private onDragstart(event: DragEvent) {
    Logger.debug("Column onDragstart");
    const { store } = this.context;
    store.dispatch(draggableColumn(this.tableId, this.column.id));
  }
  private onDragend(event: DragEvent) {
    Logger.debug("Column onDragend");
    const { store } = this.context;
    store.dispatch(draggableEndColumn());
  }
  private onDragover(event: DragEvent) {
    Logger.debug("Column onDragover");
    this.dispatchEvent(
      new CustomEvent("dragover", {
        detail: {
          tableId: this.tableId,
          columnId: this.column.id,
        },
      })
    );
  }
}
