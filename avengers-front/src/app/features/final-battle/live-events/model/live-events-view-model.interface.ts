import { PageState } from "../../../../core/models/page-state.interface";
import { LiveEventsApi } from "./live-events-api.interface";

export interface LiveEventsViewModel extends PageState {
    data: LiveEventsApi | null;
    lang: 'es' | 'en';
}