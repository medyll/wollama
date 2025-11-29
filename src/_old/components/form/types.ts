export interface CreateUpdateProps<T = string> {
	mode:         'create' | 'update' | 'show';
	collection:   string;
	data?:        Record<string, any>;
	withData?:    Record<string, any>;
	dataId?:      any;
	/** fields to show in the collection */
	showFields?:  T[];
	/** 
        allow in place edition, for all fields, or some
        only available in show mode
     */
	inPlaceEdit?: boolean | T[];

	/**  display mode for the fields */
	displayMode?: 'vertical' | 'wrap';

	showFks?:     boolean;
}
