export default class ValidationError extends Error {
    code: number;
    details: string;

    constructor(message: string, details: string) {
        super(message);

        this.code = 422;
        this.details = details;
    }
}