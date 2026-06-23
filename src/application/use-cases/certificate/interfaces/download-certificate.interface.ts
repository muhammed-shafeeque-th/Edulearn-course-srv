import { Readable } from "node:stream";

export abstract class IDownloadCertificateUseCase {
  /**
   * Download a certificate as a PDF stream.
   * @param certificateId string - The certificate's unique identifier
   * @param userId string - The requesting user's ID
   * @returns Readable - PDF stream
   * @throws NotFoundException - If certificate not found
   * @throws ForbiddenException - If user does not own certificate
   */
  abstract execute(certificateId: string, userId: string): Promise<Readable>;
}
