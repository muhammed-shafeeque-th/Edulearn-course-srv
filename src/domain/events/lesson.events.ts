export class LessonCreatedEvent {
    constructor(
      public readonly courseId: string,
    ) {}
  }
  
  export class LessonDeletedEvent {
    constructor(
      public readonly courseId: string,
    ) {}
  }
  