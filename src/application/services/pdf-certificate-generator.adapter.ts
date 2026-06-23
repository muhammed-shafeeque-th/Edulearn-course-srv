import { Readable } from "node:stream";
import { Certificate } from "src/domain/entities/certificate.entity";

/**
 * Service for generating PDF certificates.
 * Implementations of this class are responsible for creating
 * a readable stream containing the generated PDF document based
 * on the provided Certificate entity.
 */
export abstract class ICertificatePDFGenerator {
    /**
     * Generates a PDF representation of a certificate.
     * 
     * @param certificate - The certificate entity with content to include in the PDF.
     * @returns Promise that resolves to a readable stream of the generated PDF.
     */
    abstract generate(certificate: Certificate): Promise<Readable>;
}