import { TimeProfile } from './v8-types';
export declare function startProfiling(runName: string, includeLineInfo?: boolean): void;
export declare function stopProfiling(runName: string, includeLineInfo?: boolean): TimeProfile;
export declare function setSamplingInterval(intervalMicros: number): void;
