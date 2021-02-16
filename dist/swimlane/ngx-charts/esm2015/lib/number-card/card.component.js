import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { trimLabel } from '../common/trim-label.helper';
import { roundedRect } from '../common/shape.helper';
import { escapeLabel } from '../common/label.helper';
import { decimalChecker, count } from '../common/count/count.helper';
export class CardComponent {
    constructor(element, cd, zone) {
        this.cd = cd;
        this.zone = zone;
        this.animations = true;
        this.select = new EventEmitter();
        this.value = '';
        this.textFontSize = 12;
        this.textTransform = '';
        this.initialized = false;
        this.bandHeight = 10;
        this.textPadding = [10, 20, 5, 20];
        this.labelFontSize = 15;
        this.element = element.nativeElement;
    }
    ngOnChanges(changes) {
        this.update();
    }
    ngOnDestroy() {
        cancelAnimationFrame(this.animationReq);
    }
    update() {
        this.zone.run(() => {
            const hasValue = this.data && typeof this.data.value !== 'undefined';
            const valueFormatting = this.valueFormatting || (card => card.value.toLocaleString());
            const labelFormatting = this.labelFormatting || (card => escapeLabel(trimLabel(card.label, 55)));
            this.transform = `translate(${this.x} , ${this.y})`;
            this.textWidth = Math.max(0, this.width) - this.textPadding[1] - this.textPadding[3];
            this.cardWidth = Math.max(0, this.width);
            this.cardHeight = Math.max(0, this.height);
            this.label = this.label ? this.label : this.data.name;
            const cardData = {
                label: this.label,
                data: this.data,
                value: this.data.value
            };
            this.formattedLabel = labelFormatting(cardData);
            this.transformBand = `translate(0 , ${this.cardHeight - this.bandHeight})`;
            const value = hasValue ? valueFormatting(cardData) : '';
            this.value = this.paddedValue(value);
            this.setPadding();
            this.bandPath = roundedRect(0, 0, this.cardWidth, this.bandHeight, 3, [false, false, true, true]);
            setTimeout(() => {
                this.scaleText();
                this.value = value;
                if (hasValue && !this.initialized) {
                    setTimeout(() => this.startCount(), 20);
                }
            }, 8);
        });
    }
    paddedValue(value) {
        if (this.medianSize && this.medianSize > value.length) {
            value += '\u2007'.repeat(this.medianSize - value.length);
        }
        return value;
    }
    startCount() {
        if (!this.initialized && this.animations) {
            cancelAnimationFrame(this.animationReq);
            const val = this.data.value;
            const decs = decimalChecker(val);
            const valueFormatting = this.valueFormatting || (card => card.value.toLocaleString());
            const callback = ({ value, finished }) => {
                this.zone.run(() => {
                    value = finished ? val : value;
                    this.value = valueFormatting({ label: this.label, data: this.data, value });
                    if (!finished) {
                        this.value = this.paddedValue(this.value);
                    }
                    this.cd.markForCheck();
                });
            };
            this.animationReq = count(0, val, decs, 1, callback);
            this.initialized = true;
        }
    }
    scaleText() {
        this.zone.run(() => {
            const { width, height } = this.textEl.nativeElement.getBoundingClientRect();
            if (width === 0 || height === 0) {
                return;
            }
            const textPadding = (this.textPadding[1] = this.textPadding[3] = this.cardWidth / 8);
            const availableWidth = this.cardWidth - 2 * textPadding;
            const availableHeight = this.cardHeight / 3;
            const resizeScale = Math.min(availableWidth / width, availableHeight / height);
            this.textFontSize = Math.floor(this.textFontSize * resizeScale);
            this.labelFontSize = Math.min(this.textFontSize, 15);
            this.setPadding();
            this.cd.markForCheck();
        });
    }
    setPadding() {
        this.textPadding[1] = this.textPadding[3] = this.cardWidth / 8;
        const padding = this.cardHeight / 2;
        this.textPadding[0] = padding - this.textFontSize - this.labelFontSize / 2;
        this.textPadding[2] = padding - this.labelFontSize;
    }
    onClick() {
        this.select.emit(this.data);
    }
}
CardComponent.decorators = [
    { type: Component, args: [{
                selector: 'g[ngx-charts-card]',
                template: `
    <svg:g [attr.transform]="transform" class="cell" (click)="onClick()">
      <svg:rect class="card" [style.fill]="color" [attr.width]="cardWidth" [attr.height]="cardHeight" rx="3" ry="3" />
      <svg:path
        *ngIf="bandColor && bandColor !== color"
        class="card-band"
        [attr.fill]="bandColor"
        [attr.transform]="transformBand"
        stroke="none"
        [attr.d]="bandPath"
      />
      <title>{{ label }}</title>
      <svg:foreignObject
        class="trimmed-label"
        x="5"
        [attr.x]="textPadding[3]"
        [attr.y]="cardHeight - textPadding[2]"
        [attr.width]="textWidth"
        [attr.height]="labelFontSize + textPadding[2]"
        alignment-baseline="hanging"
      >
        <xhtml:p
          [style.color]="textColor"
          [style.fontSize.px]="labelFontSize"
          [style.lineHeight.px]="labelFontSize"
          [innerHTML]="formattedLabel"
        >
        </xhtml:p>
      </svg:foreignObject>
      <svg:text
        #textEl
        class="value-text"
        [attr.x]="textPadding[3]"
        [attr.y]="textPadding[0]"
        [style.fill]="textColor"
        text-anchor="start"
        alignment-baseline="hanging"
        [style.font-size.pt]="textFontSize"
      >
        {{ value }}
      </svg:text>
    </svg:g>
  `,
                changeDetection: ChangeDetectionStrategy.OnPush
            },] }
];
CardComponent.ctorParameters = () => [
    { type: ElementRef },
    { type: ChangeDetectorRef },
    { type: NgZone }
];
CardComponent.propDecorators = {
    color: [{ type: Input }],
    bandColor: [{ type: Input }],
    textColor: [{ type: Input }],
    x: [{ type: Input }],
    y: [{ type: Input }],
    width: [{ type: Input }],
    height: [{ type: Input }],
    label: [{ type: Input }],
    data: [{ type: Input }],
    medianSize: [{ type: Input }],
    valueFormatting: [{ type: Input }],
    labelFormatting: [{ type: Input }],
    animations: [{ type: Input }],
    select: [{ type: Output }],
    textEl: [{ type: ViewChild, args: ['textEl', { static: false },] }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FyZC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vLi4vcHJvamVjdHMvc3dpbWxhbmUvbmd4LWNoYXJ0cy9zcmMvIiwic291cmNlcyI6WyJsaWIvbnVtYmVyLWNhcmQvY2FyZC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFNBQVMsRUFDVCxLQUFLLEVBQ0wsTUFBTSxFQUNOLFlBQVksRUFDWixVQUFVLEVBR1YsU0FBUyxFQUNULHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsTUFBTSxFQUVQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUN4RCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFDckQsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFpRHJFLE1BQU0sT0FBTyxhQUFhO0lBdUN4QixZQUFZLE9BQW1CLEVBQVUsRUFBcUIsRUFBVSxJQUFZO1FBQTNDLE9BQUUsR0FBRixFQUFFLENBQW1CO1FBQVUsU0FBSSxHQUFKLElBQUksQ0FBUTtRQXpCM0UsZUFBVSxHQUFZLElBQUksQ0FBQztRQUUxQixXQUFNLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUt0QyxVQUFLLEdBQVcsRUFBRSxDQUFDO1FBTW5CLGlCQUFZLEdBQVcsRUFBRSxDQUFDO1FBQzFCLGtCQUFhLEdBQVcsRUFBRSxDQUFDO1FBQzNCLGdCQUFXLEdBQVksS0FBSyxDQUFDO1FBRzdCLGVBQVUsR0FBVyxFQUFFLENBQUM7UUFFeEIsZ0JBQVcsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzlCLGtCQUFhLEdBQUcsRUFBRSxDQUFDO1FBS2pCLElBQUksQ0FBQyxP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O3dCQUNMLEtBQUs7d0JBQ0wsS0FBSztnQkFFTCxLQUFLO2dCQUNMLEtBQUs7b0JBQ0wsS0FBSztxQkFDTCxLQUFLO29CQUNMLEtBQUs7bUJBQ0wsS0FBSzt5QkFDTCxLQUFLOzhCQUNMLEtBQUs7OEJBQ0wsS0FBSzt5QkFDTCxLQUFLO3FCQUVMLE1BQU07cUJBRU4sU0FBUyxTQUFDLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDb21wb25lbnQsXG4gIElucHV0LFxuICBPdXRwdXQsXG4gIEV2ZW50RW1pdHRlcixcbiAgRWxlbWVudFJlZixcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgT25DaGFuZ2VzLFxuICBWaWV3Q2hpbGQsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgTmdab25lLFxuICBPbkRlc3Ryb3lcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyB0cmltTGFiZWwgfSBmcm9tICcuLi9jb21tb24vdHJpbS1sYWJlbC5oZWxwZXInO1xuaW1wb3J0IHsgcm91bmRlZFJlY3QgfSBmcm9tICcuLi9jb21tb24vc2hhcGUuaGVscGVyJztcbmltcG9ydCB7IGVzY2FwZUxhYmVsIH0gZnJvbSAnLi4vY29tbW9uL2xhYmVsLmhlbHBlcic7XG5pbXBvcnQgeyBkZWNpbWFsQ2hlY2tlciwgY291bnQgfSBmcm9tICcuLi9jb21tb24vY291bnQvY291bnQuaGVscGVyJztcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnZ1tuZ3gtY2hhcnRzLWNhcmRdJyxcbiAgdGVtcGxhdGU6IGBcbiAgICA8c3ZnOmcgW2F0dHIudHJhbnNmb3JtXT1cInRyYW5zZm9ybVwiIGNsYXNzPVwiY2VsbFwiIChjbGljayk9XCJvbkNsaWNrKClcIj5cbiAgICAgIDxzdmc6cmVjdCBjbGFzcz1cImNhcmRcIiBbc3R5bGUuZmlsbF09XCJjb2xvclwiIFthdHRyLndpZHRoXT1cImNhcmRXaWR0aFwiIFthdHRyLmhlaWdodF09XCJjYXJkSGVpZ2h0XCIgcng9XCIzXCIgcnk9XCIzXCIgLz5cbiAgICAgIDxzdmc6cGF0aFxuICAgICAgICAqbmdJZj1cImJhbmRDb2xvciAmJiBiYW5kQ29sb3IgIT09IGNvbG9yXCJcbiAgICAgICAgY2xhc3M9XCJjYXJkLWJhbmRcIlxuICAgICAgICBbYXR0ci5maWxsXT1cImJhbmRDb2xvclwiXG4gICAgICAgIFthdHRyLnRyYW5zZm9ybV09XCJ0cmFuc2Zvcm1CYW5kXCJcbiAgICAgICAgc3Ryb2tlPVwibm9uZVwiXG4gICAgICAgIFthdHRyLmRdPVwiYmFuZFBhdGhcIlxuICAgICAgLz5cbiAgICAgIDx0aXRsZT57eyBsYWJlbCB9fTwvdGl0bGU+XG4gICAgICA8c3ZnOmZvcmVpZ25PYmplY3RcbiAgICAgICAgY2xhc3M9XCJ0cmltbWVkLWxhYmVsXCJcbiAgICAgICAgeD1cIjVcIlxuICAgICAgICBbYXR0ci54XT1cInRleHRQYWRkaW5nWzNdXCJcbiAgICAgICAgW2F0dHIueV09XCJjYXJkSGVpZ2h0IC0gdGV4dFBhZGRpbmdbMl1cIlxuICAgICAgICBbYXR0ci53aWR0aF09XCJ0ZXh0V2lkdGhcIlxuICAgICAgICBbYXR0ci5oZWlnaHRdPVwibGFiZWxGb250U2l6ZSArIHRleHRQYWRkaW5nWzJdXCJcbiAgICAgICAgYWxpZ25tZW50LWJhc2VsaW5lPVwiaGFuZ2luZ1wiXG4gICAgICA+XG4gICAgICAgIDx4aHRtbDpwXG4gICAgICAgICAgW3N0eWxlLmNvbG9yXT1cInRleHRDb2xvclwiXG4gICAgICAgICAgW3N0eWxlLmZvbnRTaXplLnB4XT1cImxhYmVsRm9udFNpemVcIlxuICAgICAgICAgIFtzdHlsZS5saW5lSGVpZ2h0LnB4XT1cImxhYmVsRm9udFNpemVcIlxuICAgICAgICAgIFtpbm5lckhUTUxdPVwiZm9ybWF0dGVkTGFiZWxcIlxuICAgICAgICA+XG4gICAgICAgIDwveGh0bWw6cD5cbiAgICAgIDwvc3ZnOmZvcmVpZ25PYmplY3Q+XG4gICAgICA8c3ZnOnRleHRcbiAgICAgICAgI3RleHRFbFxuICAgICAgICBjbGFzcz1cInZhbHVlLXRleHRcIlxuICAgICAgICBbYXR0ci54XT1cInRleHRQYWRkaW5nWzNdXCJcbiAgICAgICAgW2F0dHIueV09XCJ0ZXh0UGFkZGluZ1swXVwiXG4gICAgICAgIFtzdHlsZS5maWxsXT1cInRleHRDb2xvclwiXG4gICAgICAgIHRleHQtYW5jaG9yPVwic3RhcnRcIlxuICAgICAgICBhbGlnbm1lbnQtYmFzZWxpbmU9XCJoYW5naW5nXCJcbiAgICAgICAgW3N0eWxlLmZvbnQtc2l6ZS5wdF09XCJ0ZXh0Rm9udFNpemVcIlxuICAgICAgPlxuICAgICAgICB7eyB2YWx1ZSB9fVxuICAgICAgPC9zdmc6dGV4dD5cbiAgICA8L3N2ZzpnPlxuICBgLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaFxufSlcbmV4cG9ydCBjbGFzcyBDYXJkQ29tcG9uZW50IGltcGxlbWVudHMgT25DaGFuZ2VzLCBPbkRlc3Ryb3kge1xuICBASW5wdXQoKSBjb2xvcjtcbiAgQElucHV0KCkgYmFuZENvbG9yO1xuICBASW5wdXQoKSB0ZXh0Q29sb3I7XG5cbiAgQElucHV0KCkgeDtcbiAgQElucHV0KCkgeTtcbiAgQElucHV0KCkgd2lkdGg7XG4gIEBJbnB1dCgpIGhlaWdodDtcbiAgQElucHV0KCkgbGFiZWw7XG4gIEBJbnB1dCgpIGRhdGE7XG4gIEBJbnB1dCgpIG1lZGlhblNpemU6IG51bWJlcjtcbiAgQElucHV0KCkgdmFsdWVGb3JtYXR0aW5nOiBhbnk7XG4gIEBJbnB1dCgpIGxhYmVsRm9ybWF0dGluZzogYW55O1xuICBASW5wdXQoKSBhbmltYXRpb25zOiBib29sZWFuID0gdHJ1ZTtcblxuICBAT3V0cHV0KCkgc2VsZWN0ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIEBWaWV3Q2hpbGQoJ3RleHRFbCcsIHsgc3RhdGljOiBmYWxzZSB9KSB0ZXh0RWw6IEVsZW1lbnRSZWY7XG5cbiAgZWxlbWVudDogSFRNTEVsZW1lbnQ7XG4gIHZhbHVlOiBzdHJpbmcgPSAnJztcbiAgdHJhbnNmb3JtOiBzdHJpbmc7XG4gIGZvcm1hdHRlZExhYmVsOiBzdHJpbmc7XG4gIGNhcmRXaWR0aDogbnVtYmVyO1xuICBjYXJkSGVpZ2h0OiBudW1iZXI7XG4gIHRleHRXaWR0aDogbnVtYmVyO1xuICB0ZXh0Rm9udFNpemU6IG51bWJlciA9IDEyO1xuICB0ZXh0VHJhbnNmb3JtOiBzdHJpbmcgPSAnJztcbiAgaW5pdGlhbGl6ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgYW5pbWF0aW9uUmVxOiBhbnk7XG5cbiAgYmFuZEhlaWdodDogbnVtYmVyID0gMTA7XG4gIHRyYW5zZm9ybUJhbmQ6IHN0cmluZztcbiAgdGV4dFBhZGRpbmcgPSBbMTAsIDIwLCA1LCAyMF07XG4gIGxhYmVsRm9udFNpemUgPSAxNTtcblxuICBiYW5kUGF0aDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQ6IEVsZW1lbnRSZWYsIHByaXZhdGUgY2Q6IENoYW5nZURldGVjdG9yUmVmLCBwcml2YXRlIHpvbmU6IE5nWm9uZSkge1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQubmF0aXZlRWxlbWVudDtcbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5hbmltYXRpb25SZXEpO1xuICB9XG5cbiAgdXBkYXRlKCk6IHZvaWQge1xuICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgY29uc3QgaGFzVmFsdWUgPSB0aGlzLmRhdGEgJiYgdHlwZW9mIHRoaXMuZGF0YS52YWx1ZSAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICBjb25zdCB2YWx1ZUZvcm1hdHRpbmcgPSB0aGlzLnZhbHVlRm9ybWF0dGluZyB8fCAoY2FyZCA9PiBjYXJkLnZhbHVlLnRvTG9jYWxlU3RyaW5nKCkpO1xuICAgICAgY29uc3QgbGFiZWxGb3JtYXR0aW5nID0gdGhpcy5sYWJlbEZvcm1hdHRpbmcgfHwgKGNhcmQgPT4gZXNjYXBlTGFiZWwodHJpbUxhYmVsKGNhcmQubGFiZWwsIDU1KSkpO1xuXG4gICAgICB0aGlzLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHt0aGlzLnh9ICwgJHt0aGlzLnl9KWA7XG5cbiAgICAgIHRoaXMudGV4dFdpZHRoID0gTWF0aC5tYXgoMCwgdGhpcy53aWR0aCkgLSB0aGlzLnRleHRQYWRkaW5nWzFdIC0gdGhpcy50ZXh0UGFkZGluZ1szXTtcbiAgICAgIHRoaXMuY2FyZFdpZHRoID0gTWF0aC5tYXgoMCwgdGhpcy53aWR0aCk7XG4gICAgICB0aGlzLmNhcmRIZWlnaHQgPSBNYXRoLm1heCgwLCB0aGlzLmhlaWdodCk7XG5cbiAgICAgIHRoaXMubGFiZWwgPSB0aGlzLmxhYmVsID8gdGhpcy5sYWJlbCA6IHRoaXMuZGF0YS5uYW1lO1xuXG4gICAgICBjb25zdCBjYXJkRGF0YSA9IHtcbiAgICAgICAgbGFiZWw6IHRoaXMubGFiZWwsXG4gICAgICAgIGRhdGE6IHRoaXMuZGF0YSxcbiAgICAgICAgdmFsdWU6IHRoaXMuZGF0YS52YWx1ZVxuICAgICAgfTtcblxuICAgICAgdGhpcy5mb3JtYXR0ZWRMYWJlbCA9IGxhYmVsRm9ybWF0dGluZyhjYXJkRGF0YSk7XG4gICAgICB0aGlzLnRyYW5zZm9ybUJhbmQgPSBgdHJhbnNsYXRlKDAgLCAke3RoaXMuY2FyZEhlaWdodCAtIHRoaXMuYmFuZEhlaWdodH0pYDtcblxuICAgICAgY29uc3QgdmFsdWUgPSBoYXNWYWx1ZSA/IHZhbHVlRm9ybWF0dGluZyhjYXJkRGF0YSkgOiAnJztcblxuICAgICAgdGhpcy52YWx1ZSA9IHRoaXMucGFkZGVkVmFsdWUodmFsdWUpO1xuICAgICAgdGhpcy5zZXRQYWRkaW5nKCk7XG5cbiAgICAgIHRoaXMuYmFuZFBhdGggPSByb3VuZGVkUmVjdCgwLCAwLCB0aGlzLmNhcmRXaWR0aCwgdGhpcy5iYW5kSGVpZ2h0LCAzLCBbZmFsc2UsIGZhbHNlLCB0cnVlLCB0cnVlXSk7XG5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLnNjYWxlVGV4dCgpO1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIGlmIChoYXNWYWx1ZSAmJiAhdGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zdGFydENvdW50KCksIDIwKTtcbiAgICAgICAgfVxuICAgICAgfSwgOCk7XG4gICAgfSk7XG4gIH1cblxuICBwYWRkZWRWYWx1ZSh2YWx1ZTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMubWVkaWFuU2l6ZSAmJiB0aGlzLm1lZGlhblNpemUgPiB2YWx1ZS5sZW5ndGgpIHtcbiAgICAgIHZhbHVlICs9ICdcXHUyMDA3Jy5yZXBlYXQodGhpcy5tZWRpYW5TaXplIC0gdmFsdWUubGVuZ3RoKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgc3RhcnRDb3VudCgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuaW5pdGlhbGl6ZWQgJiYgdGhpcy5hbmltYXRpb25zKSB7XG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmFuaW1hdGlvblJlcSk7XG5cbiAgICAgIGNvbnN0IHZhbCA9IHRoaXMuZGF0YS52YWx1ZTtcbiAgICAgIGNvbnN0IGRlY3MgPSBkZWNpbWFsQ2hlY2tlcih2YWwpO1xuICAgICAgY29uc3QgdmFsdWVGb3JtYXR0aW5nID0gdGhpcy52YWx1ZUZvcm1hdHRpbmcgfHwgKGNhcmQgPT4gY2FyZC52YWx1ZS50b0xvY2FsZVN0cmluZygpKTtcblxuICAgICAgY29uc3QgY2FsbGJhY2sgPSAoeyB2YWx1ZSwgZmluaXNoZWQgfSkgPT4ge1xuICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICB2YWx1ZSA9IGZpbmlzaGVkID8gdmFsIDogdmFsdWU7XG4gICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlRm9ybWF0dGluZyh7IGxhYmVsOiB0aGlzLmxhYmVsLCBkYXRhOiB0aGlzLmRhdGEsIHZhbHVlIH0pO1xuICAgICAgICAgIGlmICghZmluaXNoZWQpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLnBhZGRlZFZhbHVlKHRoaXMudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmNkLm1hcmtGb3JDaGVjaygpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuYW5pbWF0aW9uUmVxID0gY291bnQoMCwgdmFsLCBkZWNzLCAxLCBjYWxsYmFjayk7XG4gICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBzY2FsZVRleHQoKTogdm9pZCB7XG4gICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XG4gICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IHRoaXMudGV4dEVsLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBpZiAod2lkdGggPT09IDAgfHwgaGVpZ2h0ID09PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGV4dFBhZGRpbmcgPSAodGhpcy50ZXh0UGFkZGluZ1sxXSA9IHRoaXMudGV4dFBhZGRpbmdbM10gPSB0aGlzLmNhcmRXaWR0aCAvIDgpO1xuICAgICAgY29uc3QgYXZhaWxhYmxlV2lkdGggPSB0aGlzLmNhcmRXaWR0aCAtIDIgKiB0ZXh0UGFkZGluZztcbiAgICAgIGNvbnN0IGF2YWlsYWJsZUhlaWdodCA9IHRoaXMuY2FyZEhlaWdodCAvIDM7XG5cbiAgICAgIGNvbnN0IHJlc2l6ZVNjYWxlID0gTWF0aC5taW4oYXZhaWxhYmxlV2lkdGggLyB3aWR0aCwgYXZhaWxhYmxlSGVpZ2h0IC8gaGVpZ2h0KTtcbiAgICAgIHRoaXMudGV4dEZvbnRTaXplID0gTWF0aC5mbG9vcih0aGlzLnRleHRGb250U2l6ZSAqIHJlc2l6ZVNjYWxlKTtcbiAgICAgIHRoaXMubGFiZWxGb250U2l6ZSA9IE1hdGgubWluKHRoaXMudGV4dEZvbnRTaXplLCAxNSk7XG5cbiAgICAgIHRoaXMuc2V0UGFkZGluZygpO1xuICAgICAgdGhpcy5jZC5tYXJrRm9yQ2hlY2soKTtcbiAgICB9KTtcbiAgfVxuXG4gIHNldFBhZGRpbmcoKSB7XG4gICAgdGhpcy50ZXh0UGFkZGluZ1sxXSA9IHRoaXMudGV4dFBhZGRpbmdbM10gPSB0aGlzLmNhcmRXaWR0aCAvIDg7XG4gICAgY29uc3QgcGFkZGluZyA9IHRoaXMuY2FyZEhlaWdodCAvIDI7XG4gICAgdGhpcy50ZXh0UGFkZGluZ1swXSA9IHBhZGRpbmcgLSB0aGlzLnRleHRGb250U2l6ZSAtIHRoaXMubGFiZWxGb250U2l6ZSAvIDI7XG4gICAgdGhpcy50ZXh0UGFkZGluZ1syXSA9IHBhZGRpbmcgLSB0aGlzLmxhYmVsRm9udFNpemU7XG4gIH1cblxuICBvbkNsaWNrKCk6IHZvaWQge1xuICAgIHRoaXMuc2VsZWN0LmVtaXQodGhpcy5kYXRhKTtcbiAgfVxufVxuIl19