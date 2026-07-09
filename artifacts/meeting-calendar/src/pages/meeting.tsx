import { useRoute, useLocation, Link } from "wouter";
import { useGetMeeting, useDeleteMeeting, useGetMeetingComments, useCreateComment } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Calendar, Clock, MapPin, Trash2, Users, Video, MessageSquare, Send } from "lucide-react";
import { queryClient } from "@/App";
import { useUser } from "@clerk/react";

export default function MeetingDetail() {
  const [, params] = useRoute("/meetings/:id");
  const [, setLocation] = useLocation();
  const meetingId = params?.id ? Number(params.id) : null;
  const { user } = useUser();
  const [commentText, setCommentText] = useState("");

  const { data: meeting, isLoading } = useGetMeeting(meetingId!, {
    query: {
      enabled: !!meetingId,
      queryKey: ["getMeeting", meetingId],
    }
  });

  const { data: comments, refetch: refetchComments } = useGetMeetingComments(meetingId!, {
    query: { enabled: !!meetingId, queryKey: ["getMeetingComments", meetingId] }
  });

  const createComment = useCreateComment();
  const deleteMeeting = useDeleteMeeting();

  const handleAddComment = async () => {
    if (!commentText.trim() || !meetingId) return;
    await createComment.mutateAsync({
      id: meetingId,
      data: {
        authorName: user?.fullName ?? user?.username ?? "Аноним",
        content: commentText.trim(),
      }
    });
    setCommentText("");
    refetchComments();
  };

  const handleDelete = async () => {
    if (!meetingId) return;
    try {
      await deleteMeeting.mutateAsync({ id: meetingId });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/week"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setLocation("/");
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Встреча не найдена
      </div>
    );
  }

  const startTime = parseISO(meeting.startTime);
  const endTime = parseISO(meeting.endTime);

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto pb-20">
      <header className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Назад
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight leading-tight">
            {meeting.title}
          </h1>
          <div className="shrink-0 pt-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Отменить
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Встреча будет удалена из календаря всех участников.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Закрыть</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleteMeeting.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Удалить встречу
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border rounded-xl p-5 shadow-sm col-span-2">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Дата</h3>
                <p className="font-medium text-lg capitalize">{format(startTime, 'EEEE, d MMMM yyyy', { locale: ru })}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Время</h3>
                <p className="font-mono text-lg">{format(startTime, 'HH:mm')} — {format(endTime, 'HH:mm')}</p>
              </div>
            </div>

            {meeting.location && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Место</h3>
                  <p className="font-medium text-lg">{meeting.location}</p>
                </div>
              </div>
            )}

            {meeting.meetingLink && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Ссылка на встречу</h3>
                  <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer"
                    className="text-primary hover:underline break-all font-medium">
                    {meeting.meetingLink}
                  </a>
                </div>
              </div>
            )}
          </div>

          {meeting.description && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Описание</h3>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{meeting.description}</p>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm h-fit">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-muted-foreground" />
            Участники
          </h3>

          <div className="mb-6">
            <p className="text-xs text-muted-foreground font-mono mb-2 uppercase tracking-wider">Организатор</p>
            <div className="flex items-center gap-3 bg-secondary/50 p-2 rounded-md">
              <Avatar initials={meeting.organizer.avatarInitials} color={meeting.organizer.color} className="w-8 h-8 text-xs" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{meeting.organizer.name}</p>
                <p className="text-xs text-muted-foreground truncate">{meeting.organizer.role}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-mono mb-2 uppercase tracking-wider">Приглашены ({meeting.participants.length})</p>
            <div className="space-y-2">
              {meeting.participants.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-secondary/30 rounded-md transition-colors">
                  <Avatar initials={p.avatarInitials} color={p.color} className="w-8 h-8 text-xs" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <section className="mt-6">
        <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-primary" />
          Комментарии ({comments?.length ?? 0})
        </h3>
        <div className="space-y-3 mb-4">
          {(comments ?? []).map(c => (
            <div key={c.id} className="bg-card border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{c.authorName}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {format(new Date(c.createdAt), "d MMM, HH:mm", { locale: ru })}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
          {(!comments || comments.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">Комментариев пока нет</p>
          )}
        </div>
        <div className="flex gap-3">
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Написать комментарий..."
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors min-h-[80px]"
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddComment(); }}
          />
          <button
            onClick={handleAddComment}
            disabled={!commentText.trim() || createComment.isPending}
            className="self-end h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Ctrl+Enter для отправки</p>
      </section>
    </div>
  );
}
