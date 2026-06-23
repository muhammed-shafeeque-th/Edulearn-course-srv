export abstract class IDeleteProgressUseCase {
  abstract execute(progressId: string): Promise<void>;
}
