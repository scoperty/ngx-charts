import { OnChanges, SimpleChanges } from '@angular/core';
export declare class PieLabelComponent implements OnChanges {
    data: any;
    radius: any;
    label: any;
    color: any;
    max: any;
    value: any;
    explodeSlices: any;
    animations: boolean;
    labelTrim: boolean;
    labelTrimSize: number;
    trimLabel: (label: string, max?: number) => string;
    line: string;
    private readonly isIE;
    constructor();
    ngOnChanges(changes: SimpleChanges): void;
    update(): void;
    get textX(): number;
    get textY(): number;
    get styleTransform(): string;
    get attrTransform(): string;
    get textTransition(): string;
    textAnchor(): any;
    midAngle(d: any): number;
}
