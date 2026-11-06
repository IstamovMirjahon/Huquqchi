namespace Huquqchi.Domain;

public enum WorkspaceKind { Personal, Business }
public enum MemberRole { Owner, Member, LegalEditor, Support, Administrator }
public enum MessageRole { User, Assistant, System }
public enum DocumentStatus { Saved, Processing, Ready, Failed, Draft, Deleted }
public enum DocumentOrigin { Uploaded, Chat, Generated }
public enum AnalysisStatus { Queued, Processing, Completed, Failed }
public enum FindingSeverity { Information, NeedsReview, HighAttention }
public enum ContentStatus { Draft, Review, Published, Archived }
public enum OtpDeliveryChannel { Telegram }
