import { Component, Input, ViewChild, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { scaleLinear } from 'd3-scale';
import { BaseChartComponent } from '../common/base-chart.component';
import { calculateViewDimensions } from '../common/view-dimensions.helper';
import { ColorHelper } from '../common/color.helper';
export class LinearGaugeComponent extends BaseChartComponent {
    constructor() {
        super(...arguments);
        this.min = 0;
        this.max = 100;
        this.value = 0;
        this.margin = [10, 20, 10, 20];
        this.valueResizeScale = 1;
        this.unitsResizeScale = 1;
        this.valueTextTransform = '';
        this.valueTranslate = '';
        this.unitsTextTransform = '';
        this.unitsTranslate = '';
    }
    ngAfterViewInit() {
        super.ngAfterViewInit();
        setTimeout(() => {
            this.scaleText('value');
            this.scaleText('units');
        });
    }
    update() {
        super.update();
        this.hasPreviousValue = this.previousValue !== undefined;
        this.max = Math.max(this.max, this.value);
        this.min = Math.min(this.min, this.value);
        if (this.hasPreviousValue) {
            this.max = Math.max(this.max, this.previousValue);
            this.min = Math.min(this.min, this.previousValue);
        }
        this.dims = calculateViewDimensions({
            width: this.width,
            height: this.height,
            margins: this.margin
        });
        this.valueDomain = this.getValueDomain();
        this.valueScale = this.getValueScale();
        this.displayValue = this.getDisplayValue();
        this.setColors();
        const xOffset = this.margin[3] + this.dims.width / 2;
        const yOffset = this.margin[0] + this.dims.height / 2;
        this.transform = `translate(${xOffset}, ${yOffset})`;
        this.transformLine = `translate(${this.margin[3] + this.valueScale(this.previousValue)}, ${yOffset})`;
        this.valueTranslate = `translate(0, -15)`;
        this.unitsTranslate = `translate(0, 15)`;
        setTimeout(() => this.scaleText('value'), 50);
        setTimeout(() => this.scaleText('units'), 50);
    }
    getValueDomain() {
        return [this.min, this.max];
    }
    getValueScale() {
        return scaleLinear().range([0, this.dims.width]).domain(this.valueDomain);
    }
    getDisplayValue() {
        if (this.valueFormatting) {
            return this.valueFormatting(this.value);
        }
        return this.value.toLocaleString();
    }
    scaleText(element, repeat = true) {
        let el;
        let resizeScale;
        if (element === 'value') {
            el = this.valueTextEl;
            resizeScale = this.valueResizeScale;
        }
        else {
            el = this.unitsTextEl;
            resizeScale = this.unitsResizeScale;
        }
        const { width, height } = el.nativeElement.getBoundingClientRect();
        if (width === 0 || height === 0)
            return;
        const oldScale = resizeScale;
        const availableWidth = this.dims.width;
        const availableHeight = Math.max(this.dims.height / 2 - 15, 0);
        const resizeScaleWidth = Math.floor((availableWidth / (width / resizeScale)) * 100) / 100;
        const resizeScaleHeight = Math.floor((availableHeight / (height / resizeScale)) * 100) / 100;
        resizeScale = Math.min(resizeScaleHeight, resizeScaleWidth);
        if (resizeScale !== oldScale) {
            if (element === 'value') {
                this.valueResizeScale = resizeScale;
                this.valueTextTransform = `scale(${resizeScale}, ${resizeScale})`;
            }
            else {
                this.unitsResizeScale = resizeScale;
                this.unitsTextTransform = `scale(${resizeScale}, ${resizeScale})`;
            }
            this.cd.markForCheck();
            if (repeat) {
                setTimeout(() => {
                    this.scaleText(element, false);
                }, 50);
            }
        }
    }
    onClick() {
        this.select.emit({
            name: 'Value',
            value: this.value
        });
    }
    setColors() {
        this.colors = new ColorHelper(this.scheme, 'ordinal', [this.value], this.customColors);
    }
}
LinearGaugeComponent.decorators = [
    { type: Component, args: [{
                selector: 'ngx-charts-linear-gauge',
                template: `
    <ngx-charts-chart [view]="[width, height]" [showLegend]="false" [animations]="animations" (click)="onClick()">
      <svg:g class="linear-gauge chart">
        <svg:g
          ngx-charts-bar
          class="background-bar"
          [width]="dims.width"
          [height]="3"
          [x]="margin[3]"
          [y]="dims.height / 2 + margin[0] - 2"
          [data]="{}"
          [orientation]="'horizontal'"
          [roundEdges]="true"
          [animations]="animations"
        ></svg:g>
        <svg:g
          ngx-charts-bar
          [width]="valueScale(value)"
          [height]="3"
          [x]="margin[3]"
          [y]="dims.height / 2 + margin[0] - 2"
          [fill]="colors.getColor(units)"
          [data]="{}"
          [orientation]="'horizontal'"
          [roundEdges]="true"
          [animations]="animations"
        ></svg:g>

        <svg:line
          *ngIf="hasPreviousValue"
          [attr.transform]="transformLine"
          x1="0"
          y1="5"
          x2="0"
          y2="15"
          [attr.stroke]="colors.getColor(units)"
        />

        <svg:line
          *ngIf="hasPreviousValue"
          [attr.transform]="transformLine"
          x1="0"
          y1="-5"
          x2="0"
          y2="-15"
          [attr.stroke]="colors.getColor(units)"
        />

        <svg:g [attr.transform]="transform">
          <svg:g [attr.transform]="valueTranslate">
            <svg:text
              #valueTextEl
              class="value"
              [style.textAnchor]="'middle'"
              [attr.transform]="valueTextTransform"
              alignment-baseline="after-edge"
            >
              {{ displayValue }}
            </svg:text>
          </svg:g>

          <svg:g [attr.transform]="unitsTranslate">
            <svg:text
              #unitsTextEl
              class="units"
              [style.textAnchor]="'middle'"
              [attr.transform]="unitsTextTransform"
              alignment-baseline="before-edge"
            >
              {{ units }}
            </svg:text>
          </svg:g>
        </svg:g>
      </svg:g>
    </ngx-charts-chart>
  `,
                encapsulation: ViewEncapsulation.None,
                changeDetection: ChangeDetectionStrategy.OnPush,
                styles: [".ngx-charts{float:left;overflow:visible}.ngx-charts .arc,.ngx-charts .bar,.ngx-charts .circle{cursor:pointer}.ngx-charts .arc.active,.ngx-charts .arc:hover,.ngx-charts .bar.active,.ngx-charts .bar:hover,.ngx-charts .card.active,.ngx-charts .card:hover,.ngx-charts .cell.active,.ngx-charts .cell:hover{opacity:.8;transition:opacity .1s ease-in-out}.ngx-charts .arc:focus,.ngx-charts .bar:focus,.ngx-charts .card:focus,.ngx-charts .cell:focus{outline:none}.ngx-charts .arc.hidden,.ngx-charts .bar.hidden,.ngx-charts .card.hidden,.ngx-charts .cell.hidden{display:none}.ngx-charts g:focus{outline:none}.ngx-charts .area-series.inactive,.ngx-charts .line-series-range.inactive,.ngx-charts .line-series.inactive,.ngx-charts .polar-series-area.inactive,.ngx-charts .polar-series-path.inactive{opacity:.2;transition:opacity .1s ease-in-out}.ngx-charts .line-highlight{display:none}.ngx-charts .line-highlight.active{display:block}.ngx-charts .area{opacity:.6}.ngx-charts .circle:hover{cursor:pointer}.ngx-charts .label{font-size:12px;font-weight:400}.ngx-charts .tooltip-anchor{fill:#000}.ngx-charts .gridline-path{fill:none;stroke:#ddd;stroke-width:1}.ngx-charts .refline-path{stroke:#a8b2c7;stroke-dasharray:5;stroke-dashoffset:5;stroke-width:1}.ngx-charts .refline-label{font-size:9px}.ngx-charts .reference-area{fill:#000;fill-opacity:.05}.ngx-charts .gridline-path-dotted{fill:none;stroke:#ddd;stroke-dasharray:1,20;stroke-dashoffset:3;stroke-width:1}.ngx-charts .grid-panel rect{fill:none}.ngx-charts .grid-panel.odd rect{fill:rgba(0,0,0,.05)}", ".linear-gauge{cursor:pointer}.linear-gauge .background-bar path{fill:rgba(0,0,0,.05)}.linear-gauge .units{fill:#666}"]
            },] }
];
LinearGaugeComponent.propDecorators = {
    min: [{ type: Input }],
    max: [{ type: Input }],
    value: [{ type: Input }],
    units: [{ type: Input }],
    previousValue: [{ type: Input }],
    valueFormatting: [{ type: Input }],
    valueTextEl: [{ type: ViewChild, args: ['valueTextEl',] }],
    unitsTextEl: [{ type: ViewChild, args: ['unitsTextEl',] }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZWFyLWdhdWdlLmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLi8uLi9wcm9qZWN0cy9zd2ltbGFuZS9uZ3gtY2hhcnRzL3NyYy8iLCJzb3VyY2VzIjpbImxpYi9nYXVnZS9saW5lYXItZ2F1Z2UuY29tcG9uZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTCxTQUFTLEVBQ1QsS0FBSyxFQUVMLFNBQVMsRUFFVCxpQkFBaUIsRUFDakIsdUJBQXVCLEVBQ3hCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFFdkMsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDcEUsT0FBTyxFQUFFLHVCQUF1QixFQUFrQixNQUFNLGtDQUFrQyxDQUFDO0FBQzNGLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQW9GckQsTUFBTSxPQUFPLG9CQUFxQixTQUFRLGtCQUFrQjtJQWxGNUQ7O1FBbUZXLFFBQUcsR0FBVyxDQUFDLENBQUM7UUFDaEIsUUFBRyxHQUFXLEdBQUcsQ0FBQztRQUNsQixVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBYzNCLFdBQU0sR0FBVSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBR2pDLHFCQUFnQixHQUFXLENBQUMsQ0FBQztRQUM3QixxQkFBZ0IsR0FBVyxDQUFDLENBQUM7UUFDN0IsdUJBQWtCLEdBQVcsRUFBRSxDQUFDO1FBQ2hDLG1CQUFjLEdBQVcsRUFBRSxDQUFDO1FBQzVCLHVCQUFrQixHQUFXLEVBQUUsQ0FBQztRQUNoQyxtQkFBYyxHQUFXLEVBQUUsQ0FBQztJQTRHOUIsQ0FBQztJQXhHQyxlQUFlO1FBQ2IsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3hCLFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDZCxJQUFJLENBQUMsU0FBUyxDQUFD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QUFRLEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTJFVDtnQkFFRCxhQUFhLEVBQUUsaUJBQWlCLENBQUMsSUFBSTtnQkFDckMsZUFBZSxFQUFFLHVCQUF1QixDQUFDLE1BQU07O2FBQ2hEOzs7a0JBRUUsS0FBSztrQkFDTCxLQUFLO29CQUNMLEtBQUs7b0JBQ0wsS0FBSzs0QkFDTCxLQUFLOzhCQUNMLEtBQUs7MEJBRUwsU0FBUyxTQUFDLGFBQWE7MEJBQ3ZCLFNBQVMsU0FBQyxhQUFhIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBJbnB1dCxcbiAgRWxlbWVudFJlZixcbiAgVmlld0NoaWxkLFxuICBBZnRlclZpZXdJbml0LFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBzY2FsZUxpbmVhciB9IGZyb20gJ2QzLXNjYWxlJztcblxuaW1wb3J0IHsgQmFzZUNoYXJ0Q29tcG9uZW50IH0gZnJvbSAnLi4vY29tbW9uL2Jhc2UtY2hhcnQuY29tcG9uZW50JztcbmltcG9ydCB7IGNhbGN1bGF0ZVZpZXdEaW1lbnNpb25zLCBWaWV3RGltZW5zaW9ucyB9IGZyb20gJy4uL2NvbW1vbi92aWV3LWRpbWVuc2lvbnMuaGVscGVyJztcbmltcG9ydCB7IENvbG9ySGVscGVyIH0gZnJvbSAnLi4vY29tbW9uL2NvbG9yLmhlbHBlcic7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ25neC1jaGFydHMtbGluZWFyLWdhdWdlJyxcbiAgdGVtcGxhdGU6IGBcbiAgICA8bmd4LWNoYXJ0cy1jaGFydCBbdmlld109XCJbd2lkdGgsIGhlaWdodF1cIiBbc2hvd0xlZ2VuZF09XCJmYWxzZVwiIFthbmltYXRpb25zXT1cImFuaW1hdGlvbnNcIiAoY2xpY2spPVwib25DbGljaygpXCI+XG4gICAgICA8c3ZnOmcgY2xhc3M9XCJsaW5lYXItZ2F1Z2UgY2hhcnRcIj5cbiAgICAgICAgPHN2ZzpnXG4gICAgICAgICAgbmd4LWNoYXJ0cy1iYXJcbiAgICAgICAgICBjbGFzcz1cImJhY2tncm91bmQtYmFyXCJcbiAgICAgICAgICBbd2lkdGhdPVwiZGltcy53aWR0aFwiXG4gICAgICAgICAgW2hlaWdodF09XCIzXCJcbiAgICAgICAgICBbeF09XCJtYXJnaW5bM11cIlxuICAgICAgICAgIFt5XT1cImRpbXMuaGVpZ2h0IC8gMiArIG1hcmdpblswXSAtIDJcIlxuICAgICAgICAgIFtkYXRhXT1cInt9XCJcbiAgICAgICAgICBbb3JpZW50YXRpb25dPVwiJ2hvcml6b250YWwnXCJcbiAgICAgICAgICBbcm91bmRFZGdlc109XCJ0cnVlXCJcbiAgICAgICAgICBbYW5pbWF0aW9uc109XCJhbmltYXRpb25zXCJcbiAgICAgICAgPjwvc3ZnOmc+XG4gICAgICAgIDxzdmc6Z1xuICAgICAgICAgIG5neC1jaGFydHMtYmFyXG4gICAgICAgICAgW3dpZHRoXT1cInZhbHVlU2NhbGUodmFsdWUpXCJcbiAgICAgICAgICBbaGVpZ2h0XT1cIjNcIlxuICAgICAgICAgIFt4XT1cIm1hcmdpblszXVwiXG4gICAgICAgICAgW3ldPVwiZGltcy5oZWlnaHQgLyAyICsgbWFyZ2luWzBdIC0gMlwiXG4gICAgICAgICAgW2ZpbGxdPVwiY29sb3JzLmdldENvbG9yKHVuaXRzKVwiXG4gICAgICAgICAgW2RhdGFdPVwie31cIlxuICAgICAgICAgIFtvcmllbnRhdGlvbl09XCInaG9yaXpvbnRhbCdcIlxuICAgICAgICAgIFtyb3VuZEVkZ2VzXT1cInRydWVcIlxuICAgICAgICAgIFthbmltYXRpb25zXT1cImFuaW1hdGlvbnNcIlxuICAgICAgICA+PC9zdmc6Zz5cblxuICAgICAgICA8c3ZnOmxpbmVcbiAgICAgICAgICAqbmdJZj1cImhhc1ByZXZpb3VzVmFsdWVcIlxuICAgICAgICAgIFthdHRyLnRyYW5zZm9ybV09XCJ0cmFuc2Zvcm1MaW5lXCJcbiAgICAgICAgICB4MT1cIjBcIlxuICAgICAgICAgIHkxPVwiNVwiXG4gICAgICAgICAgeDI9XCIwXCJcbiAgICAgICAgICB5Mj1cIjE1XCJcbiAgICAgICAgICBbYXR0ci5zdHJva2VdPVwiY29sb3JzLmdldENvbG9yKHVuaXRzKVwiXG4gICAgICAgIC8+XG5cbiAgICAgICAgPHN2ZzpsaW5lXG4gICAgICAgICAgKm5nSWY9XCJoYXNQcmV2aW91c1ZhbHVlXCJcbiAgICAgICAgICBbYXR0ci50cmFuc2Zvcm1dPVwidHJhbnNmb3JtTGluZVwiXG4gICAgICAgICAgeDE9XCIwXCJcbiAgICAgICAgICB5MT1cIi01XCJcbiAgICAgICAgICB4Mj1cIjBcIlxuICAgICAgICAgIHkyPVwiLTE1XCJcbiAgICAgICAgICBbYXR0ci5zdHJva2VdPVwiY29sb3JzLmdldENvbG9yKHVuaXRzKVwiXG4gICAgICAgIC8+XG5cbiAgICAgICAgPHN2ZzpnIFthdHRyLnRyYW5zZm9ybV09XCJ0cmFuc2Zvcm1cIj5cbiAgICAgICAgICA8c3ZnOmcgW2F0dHIudHJhbnNmb3JtXT1cInZhbHVlVHJhbnNsYXRlXCI+XG4gICAgICAgICAgICA8c3ZnOnRleHRcbiAgICAgICAgICAgICAgI3ZhbHVlVGV4dEVsXG4gICAgICAgICAgICAgIGNsYXNzPVwidmFsdWVcIlxuICAgICAgICAgICAgICBbc3R5bGUudGV4dEFuY2hvcl09XCInbWlkZGxlJ1wiXG4gICAgICAgICAgICAgIFthdHRyLnRyYW5zZm9ybV09XCJ2YWx1ZVRleHRUcmFuc2Zvcm1cIlxuICAgICAgICAgICAgICBhbGlnbm1lbnQtYmFzZWxpbmU9XCJhZnRlci1lZGdlXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge3sgZGlzcGxheVZhbHVlIH19XG4gICAgICAgICAgICA8L3N2Zzp0ZXh0PlxuICAgICAgICAgIDwvc3ZnOmc+XG5cbiAgICAgICAgICA8c3ZnOmcgW2F0dHIudHJhbnNmb3JtXT1cInVuaXRzVHJhbnNsYXRlXCI+XG4gICAgICAgICAgICA8c3ZnOnRleHRcbiAgICAgICAgICAgICAgI3VuaXRzVGV4dEVsXG4gICAgICAgICAgICAgIGNsYXNzPVwidW5pdHNcIlxuICAgICAgICAgICAgICBbc3R5bGUudGV4dEFuY2hvcl09XCInbWlkZGxlJ1wiXG4gICAgICAgICAgICAgIFthdHRyLnRyYW5zZm9ybV09XCJ1bml0c1RleHRUcmFuc2Zvcm1cIlxuICAgICAgICAgICAgICBhbGlnbm1lbnQtYmFzZWxpbmU9XCJiZWZvcmUtZWRnZVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHt7IHVuaXRzIH19XG4gICAgICAgICAgICA8L3N2Zzp0ZXh0PlxuICAgICAgICAgIDwvc3ZnOmc+XG4gICAgICAgIDwvc3ZnOmc+XG4gICAgICA8L3N2ZzpnPlxuICAgIDwvbmd4LWNoYXJ0cy1jaGFydD5cbiAgYCxcbiAgc3R5bGVVcmxzOiBbJy4uL2NvbW1vbi9iYXNlLWNoYXJ0LmNvbXBvbmVudC5zY3NzJywgJy4vbGluZWFyLWdhdWdlLmNvbXBvbmVudC5zY3NzJ10sXG4gIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmUsXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoXG59KVxuZXhwb3J0IGNsYXNzIExpbmVhckdhdWdlQ29tcG9uZW50IGV4dGVuZHMgQmFzZUNoYXJ0Q29tcG9uZW50IGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCB7XG4gIEBJbnB1dCgpIG1pbjogbnVtYmVyID0gMDtcbiAgQElucHV0KCkgbWF4OiBudW1iZXIgPSAxMDA7XG4gIEBJbnB1dCgpIHZhbHVlOiBudW1iZXIgPSAwO1xuICBASW5wdXQoKSB1bml0czogc3RyaW5nO1xuICBASW5wdXQoKSBwcmV2aW91c1ZhbHVlO1xuICBASW5wdXQoKSB2YWx1ZUZvcm1hdHRpbmc6IGFueTtcblxuICBAVmlld0NoaWxkKCd2YWx1ZVRleHRFbCcpIHZhbHVlVGV4dEVsOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKCd1bml0c1RleHRFbCcpIHVuaXRzVGV4dEVsOiBFbGVtZW50UmVmO1xuXG4gIGRpbXM6IFZpZXdEaW1lbnNpb25zO1xuICB2YWx1ZURvbWFpbjogYW55O1xuICB2YWx1ZVNjYWxlOiBhbnk7XG5cbiAgY29sb3JzOiBDb2xvckhlbHBlcjtcbiAgdHJhbnNmb3JtOiBzdHJpbmc7XG4gIG1hcmdpbjogYW55W10gPSBbMTAsIDIwLCAxMCwgMjBdO1xuICB0cmFuc2Zvcm1MaW5lOiBzdHJpbmc7XG5cbiAgdmFsdWVSZXNpemVTY2FsZTogbnVtYmVyID0gMTtcbiAgdW5pdHNSZXNpemVTY2FsZTogbnVtYmVyID0gMTtcbiAgdmFsdWVUZXh0VHJhbnNmb3JtOiBzdHJpbmcgPSAnJztcbiAgdmFsdWVUcmFuc2xhdGU6IHN0cmluZyA9ICcnO1xuICB1bml0c1RleHRUcmFuc2Zvcm06IHN0cmluZyA9ICcnO1xuICB1bml0c1RyYW5zbGF0ZTogc3RyaW5nID0gJyc7XG4gIGRpc3BsYXlWYWx1ZTogc3RyaW5nO1xuICBoYXNQcmV2aW91c1ZhbHVlOiBib29sZWFuO1xuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICBzdXBlci5uZ0FmdGVyVmlld0luaXQoKTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuc2NhbGVUZXh0KCd2YWx1ZScpO1xuICAgICAgdGhpcy5zY2FsZVRleHQoJ3VuaXRzJyk7XG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGUoKTogdm9pZCB7XG4gICAgc3VwZXIudXBkYXRlKCk7XG5cbiAgICB0aGlzLmhhc1ByZXZpb3VzVmFsdWUgPSB0aGlzLnByZXZpb3VzVmFsdWUgIT09IHVuZGVmaW5lZDtcbiAgICB0aGlzLm1heCA9IE1hdGgubWF4KHRoaXMubWF4LCB0aGlzLnZhbHVlKTtcbiAgICB0aGlzLm1pbiA9IE1hdGgubWluKHRoaXMubWluLCB0aGlzLnZhbHVlKTtcbiAgICBpZiAodGhpcy5oYXNQcmV2aW91c1ZhbHVlKSB7XG4gICAgICB0aGlzLm1heCA9IE1hdGgubWF4KHRoaXMubWF4LCB0aGlzLnByZXZpb3VzVmFsdWUpO1xuICAgICAgdGhpcy5taW4gPSBNYXRoLm1pbih0aGlzLm1pbiwgdGhpcy5wcmV2aW91c1ZhbHVlKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpbXMgPSBjYWxjdWxhdGVWaWV3RGltZW5zaW9ucyh7XG4gICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICBtYXJnaW5zOiB0aGlzLm1hcmdpblxuICAgIH0pO1xuXG4gICAgdGhpcy52YWx1ZURvbWFpbiA9IHRoaXMuZ2V0VmFsdWVEb21haW4oKTtcbiAgICB0aGlzLnZhbHVlU2NhbGUgPSB0aGlzLmdldFZhbHVlU2NhbGUoKTtcbiAgICB0aGlzLmRpc3BsYXlWYWx1ZSA9IHRoaXMuZ2V0RGlzcGxheVZhbHVlKCk7XG5cbiAgICB0aGlzLnNldENvbG9ycygpO1xuXG4gICAgY29uc3QgeE9mZnNldCA9IHRoaXMubWFyZ2luWzNdICsgdGhpcy5kaW1zLndpZHRoIC8gMjtcbiAgICBjb25zdCB5T2Zmc2V0ID0gdGhpcy5tYXJnaW5bMF0gKyB0aGlzLmRpbXMuaGVpZ2h0IC8gMjtcblxuICAgIHRoaXMudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3hPZmZzZXR9LCAke3lPZmZzZXR9KWA7XG4gICAgdGhpcy50cmFuc2Zvcm1MaW5lID0gYHRyYW5zbGF0ZSgke3RoaXMubWFyZ2luWzNdICsgdGhpcy52YWx1ZVNjYWxlKHRoaXMucHJldmlvdXNWYWx1ZSl9LCAke3lPZmZzZXR9KWA7XG4gICAgdGhpcy52YWx1ZVRyYW5zbGF0ZSA9IGB0cmFuc2xhdGUoMCwgLTE1KWA7XG4gICAgdGhpcy51bml0c1RyYW5zbGF0ZSA9IGB0cmFuc2xhdGUoMCwgMTUpYDtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuc2NhbGVUZXh0KCd2YWx1ZScpLCA1MCk7XG4gICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnNjYWxlVGV4dCgndW5pdHMnKSwgNTApO1xuICB9XG5cbiAgZ2V0VmFsdWVEb21haW4oKTogYW55W10ge1xuICAgIHJldHVybiBbdGhpcy5taW4sIHRoaXMubWF4XTtcbiAgfVxuXG4gIGdldFZhbHVlU2NhbGUoKTogYW55IHtcbiAgICByZXR1cm4gc2NhbGVMaW5lYXIoKS5yYW5nZShbMCwgdGhpcy5kaW1zLndpZHRoXSkuZG9tYWluKHRoaXMudmFsdWVEb21haW4pO1xuICB9XG5cbiAgZ2V0RGlzcGxheVZhbHVlKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMudmFsdWVGb3JtYXR0aW5nKSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZUZvcm1hdHRpbmcodGhpcy52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnZhbHVlLnRvTG9jYWxlU3RyaW5nKCk7XG4gIH1cblxuICBzY2FsZVRleHQoZWxlbWVudCwgcmVwZWF0OiBib29sZWFuID0gdHJ1ZSk6IHZvaWQge1xuICAgIGxldCBlbDtcbiAgICBsZXQgcmVzaXplU2NhbGU7XG4gICAgaWYgKGVsZW1lbnQgPT09ICd2YWx1ZScpIHtcbiAgICAgIGVsID0gdGhpcy52YWx1ZVRleHRFbDtcbiAgICAgIHJlc2l6ZVNjYWxlID0gdGhpcy52YWx1ZVJlc2l6ZVNjYWxlO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbCA9IHRoaXMudW5pdHNUZXh0RWw7XG4gICAgICByZXNpemVTY2FsZSA9IHRoaXMudW5pdHNSZXNpemVTY2FsZTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGVsLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgaWYgKHdpZHRoID09PSAwIHx8IGhlaWdodCA9PT0gMCkgcmV0dXJuO1xuICAgIGNvbnN0IG9sZFNjYWxlID0gcmVzaXplU2NhbGU7XG4gICAgY29uc3QgYXZhaWxhYmxlV2lkdGggPSB0aGlzLmRpbXMud2lkdGg7XG4gICAgY29uc3QgYXZhaWxhYmxlSGVpZ2h0ID0gTWF0aC5tYXgodGhpcy5kaW1zLmhlaWdodCAvIDIgLSAxNSwgMCk7XG4gICAgY29uc3QgcmVzaXplU2NhbGVXaWR0aCA9IE1hdGguZmxvb3IoKGF2YWlsYWJsZVdpZHRoIC8gKHdpZHRoIC8gcmVzaXplU2NhbGUpKSAqIDEwMCkgLyAxMDA7XG4gICAgY29uc3QgcmVzaXplU2NhbGVIZWlnaHQgPSBNYXRoLmZsb29yKChhdmFpbGFibGVIZWlnaHQgLyAoaGVpZ2h0IC8gcmVzaXplU2NhbGUpKSAqIDEwMCkgLyAxMDA7XG4gICAgcmVzaXplU2NhbGUgPSBNYXRoLm1pbihyZXNpemVTY2FsZUhlaWdodCwgcmVzaXplU2NhbGVXaWR0aCk7XG5cbiAgICBpZiAocmVzaXplU2NhbGUgIT09IG9sZFNjYWxlKSB7XG4gICAgICBpZiAoZWxlbWVudCA9PT0gJ3ZhbHVlJykge1xuICAgICAgICB0aGlzLnZhbHVlUmVzaXplU2NhbGUgPSByZXNpemVTY2FsZTtcbiAgICAgICAgdGhpcy52YWx1ZVRleHRUcmFuc2Zvcm0gPSBgc2NhbGUoJHtyZXNpemVTY2FsZX0sICR7cmVzaXplU2NhbGV9KWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVuaXRzUmVzaXplU2NhbGUgPSByZXNpemVTY2FsZTtcbiAgICAgICAgdGhpcy51bml0c1RleHRUcmFuc2Zvcm0gPSBgc2NhbGUoJHtyZXNpemVTY2FsZX0sICR7cmVzaXplU2NhbGV9KWA7XG4gICAgICB9XG4gICAgICB0aGlzLmNkLm1hcmtGb3JDaGVjaygpO1xuICAgICAgaWYgKHJlcGVhdCkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLnNjYWxlVGV4dChlbGVtZW50LCBmYWxzZSk7XG4gICAgICAgIH0sIDUwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBvbkNsaWNrKCk6IHZvaWQge1xuICAgIHRoaXMuc2VsZWN0LmVtaXQoe1xuICAgICAgbmFtZTogJ1ZhbHVlJyxcbiAgICAgIHZhbHVlOiB0aGlzLnZhbHVlXG4gICAgfSk7XG4gIH1cblxuICBzZXRDb2xvcnMoKTogdm9pZCB7XG4gICAgdGhpcy5jb2xvcnMgPSBuZXcgQ29sb3JIZWxwZXIodGhpcy5zY2hlbWUsICdvcmRpbmFsJywgW3RoaXMudmFsdWVdLCB0aGlzLmN1c3RvbUNvbG9ycyk7XG4gIH1cbn1cbiJdfQ==