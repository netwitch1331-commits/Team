import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parse } from "date-fns";
import { useListEmployees, useCheckConflict, useCreateMeeting } from "@workspace/api-client-react";
import { queryClient } from "@/App";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, CalendarPlus, Loader2, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar } from "@/components/avatar";
import { Link } from "wouter";

const formSchema = z.object({
  title: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  date: z.string().min(1, "Дата обязательна"),
  startTime: z.string().min(1, "Время начала обязательно"),
  endTime: z.string().min(1, "Время окончания обязательно"),
  location: z.string().optional(),
  organizerId: z.string().min(1, "Организатор обязателен"),
  participantIds: z.array(z.string()).min(1, "Выберите хотя бы одного участника"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewMeeting() {
  const [, setLocation] = useLocation();
  const { data: employees, isLoading: employeesLoading } = useListEmployees();
  const checkConflict = useCheckConflict();
  const createMeeting = useCreateMeeting();

  const [conflictError, setConflictError] = useState<{
    hasConflict: boolean;
    conflicts: Array<{ employeeName: string; conflictingMeetingTitle: string }>;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "10:00",
      endTime: "11:00",
      location: "",
      organizerId: "",
      participantIds: [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    setConflictError(null);

    // Combine date and time to ISO strings
    const startDateTime = parse(`${data.date} ${data.startTime}`, "yyyy-MM-dd HH:mm", new Date());
    const endDateTime = parse(`${data.date} ${data.endTime}`, "yyyy-MM-dd HH:mm", new Date());
    
    if (endDateTime <= startDateTime) {
      form.setError("endTime", { message: "Время окончания должно быть позже времени начала" });
      return;
    }

    const startTimeIso = startDateTime.toISOString();
    const endTimeIso = endDateTime.toISOString();
    const participants = data.participantIds.map(Number);

    try {
      const conflictResult = await checkConflict.mutateAsync({
        data: {
          startTime: startTimeIso,
          endTime: endTimeIso,
          participantIds: participants,
        }
      });

      if (conflictResult.hasConflict) {
        setConflictError(conflictResult);
        return;
      }

      await createMeeting.mutateAsync({
        data: {
          title: data.title,
          description: data.description || undefined,
          startTime: startTimeIso,
          endTime: endTimeIso,
          location: data.location || undefined,
          organizerId: Number(data.organizerId),
          participantIds: participants,
        }
      });

      queryClient.invalidateQueries({ queryKey: ["/api/meetings/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/week"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      
      setLocation("/");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto pb-20">
      <header className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Назад
        </Link>
        <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Новая встреча</h1>
        <p className="text-muted-foreground font-mono mt-2">Запланировать событие</p>
      </header>

      {employeesLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название встречи</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: Синхронизация дизайна" {...field} className="text-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Начало</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Окончание</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="organizerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Организатор</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите организатора" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees?.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Avatar initials={emp.avatarInitials} color={emp.color} className="w-5 h-5 text-[10px]" />
                                {emp.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Место (необязательно)</FormLabel>
                      <FormControl>
                        <Input placeholder="Переговорная А" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание (необязательно)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Повестка встречи..." className="resize-none h-24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="participantIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Участники</FormLabel>
                      <p className="text-sm text-muted-foreground">Выберите сотрудников для приглашения</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {employees?.map((emp) => (
                        <FormField
                          key={emp.id}
                          control={form.control}
                          name="participantIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={emp.id}
                                className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 cursor-pointer hover-elevate transition-all"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(emp.id.toString())}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, emp.id.toString()])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== emp.id.toString()
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal flex flex-1 items-center gap-2 cursor-pointer">
                                  <Avatar initials={emp.avatarInitials} color={emp.color} className="w-6 h-6 text-[10px]" />
                                  <span className="truncate">{emp.name}</span>
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {conflictError && conflictError.hasConflict && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Конфликт расписания</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                      {conflictError.conflicts.map((conflict, idx) => (
                        <li key={idx}>
                          <strong>{conflict.employeeName}</strong> занят на встрече «{conflict.conflictingMeetingTitle}»
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4 border-t flex justify-end">
                <Button 
                  type="submit" 
                  disabled={checkConflict.isPending || createMeeting.isPending}
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  {(checkConflict.isPending || createMeeting.isPending) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CalendarPlus className="w-4 h-4 mr-2" />
                  )}
                  Запланировать
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}