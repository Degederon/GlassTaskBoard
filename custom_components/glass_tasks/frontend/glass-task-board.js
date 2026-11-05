/*
 * Glass Task Board card for Home Assistant
 * A frosted-glass board for recurring household tasks: tap a tile, pick who did it,
 * and it resets on its own schedule. Overdue tasks glow and remind people's phones.
 * No build step, no dependencies. Served automatically by the glass_tasks integration.
 */
(() => {
  const VERSION = "0.4.1";
  const TAG = "glass-task-board";
  if (customElements.get(TAG)) return;

  const TINTS = {
    clear: "255,255,255",
    rose: "255,128,170",
    amber: "255,196,92",
    mint: "96,232,176",
    sky: "110,182,255",
    violet: "176,138,255",
  };
  const DONE_TINT = "96,232,176";
  const OVERDUE_TINT = "255,96,128";
  const AVATAR_HUES = [200, 280, 330, 20, 150, 50, 240, 100];
  const MEMBER_EMOJI = ["🙂", "😎", "🥰", "🤓", "🦊", "🐱", "🐶", "🐼", "🦄", "🐸", "🌻", "🌙", "⭐", "🚀", "🎸", "⚽", "🍩", "👵", "👴", "👶"];
  const HUES = [210, 260, 300, 340, 15, 40, 140, 175];
  const TASK_ICONS = ["✅", "🐶", "🐱", "🐟", "🐾", "💊", "🪴", "🗑️", "♻️", "🍽️", "🧺", "🧹", "🛏️", "🚿", "🦷", "🍳", "🥣", "🧃", "📚", "🎒", "🚗", "📬", "💡", "🔒", "🔋", "🌙", "☀️", "🏃", "💧", "🧼"];
  // Ready-made tasks for a quick start. Times are "HH:MM".
  const PRESETS = [
    { icon: "🐶", key: "pr_dog", repeat: "daily", times: ["08:00", "18:00"] },
    { icon: "🐱", key: "pr_cat", repeat: "daily", times: ["08:00", "18:00"] },
    { icon: "💊", key: "pr_pills", repeat: "daily", times: ["09:00"] },
    { icon: "🗑️", key: "pr_bins", repeat: "weekly", days: [1], times: ["20:00"] },
    { icon: "🪴", key: "pr_plants", repeat: "every", every_days: 3, times: [] },
    { icon: "🍽️", key: "pr_dishwasher", repeat: "daily", times: [] },
    { icon: "🦷", key: "pr_teeth", repeat: "daily", times: ["08:00", "20:00"] },
    { icon: "🛏️", key: "pr_bed", repeat: "daily", times: ["10:00"] },
  ];
  const QUICK_TIMES = [
    { t: "08:00", key: "q_morning" },
    { t: "12:00", key: "q_noon" },
    { t: "18:00", key: "q_evening" },
    { t: "21:00", key: "q_bedtime" },
  ];
  // Words: English, German, Spanish and French. The board follows the language
  // in the viewer's Home Assistant profile; anything missing falls back to English.
  const STRINGS = {
    en: {
      rep_once: "One time", once_on: "Once on {date}", st_on: "On {when}", once_note: "It's done in one go. Once it's done, it leaves the board the next day.", q_today: "Today", q_tomorrow: "Tomorrow", pick_day: "Day", err_date: "Pick a day.",
      alert_title: "Don't forget", alert_one: "This task is overdue.", alert_many: "{n} tasks are overdue.", alert_done: "Done", alert_snooze: "Remind me in {n} min", alert_ok: "Got it", cf_alert: "Pop up overdue tasks on this screen", cf_sound: "Play a chime with the pop-up", cf_snooze: "Remind again after (minutes)",
      bg_aurora: "Aurora", bg_black: "Black", bg_sunset: "Sunset", bg_ocean: "Ocean", bg_forest: "Forest", bg_lavender: "Lavender",
      bg_ember: "Ember", bg_graphite: "Graphite", bg_midnight: "Midnight", bg_halloween: "Halloween", bg_festive: "Festive", tint_clear: "clear",
      tint_rose: "rose", tint_amber: "amber", tint_mint: "mint", tint_sky: "sky", tint_violet: "violet", cf_title: "Title", cf_height: "Height (CSS, e.g. 100vh or 720px)",
      cf_ambient: "Ambient mode after (0 = off)", cf_bgimg: "Background image URL (optional)", cf_clock: "Show clock", phone_app: "{name} (phone app)",
      home: "Home", bg_colours: "Background colours", people: "People", wake: "Tap anywhere to wake", almost: "Almost there", nothing_here: "Nothing here",
      add_people: "Add people", close: "Close", colour: "Colour", cancel: "Cancel", delete: "Delete", tap_delete: "Tap again to delete",
      edit: "Edit", default: "Default", own_colours: "Your own colours", colour_n: "Colour {n}", look_hint_html: "Changing a colour previews it right away. Select <b>Use my colours</b> to keep it.",
      in_use: "In use", use_mine: "Use my colours", edit_person: "Edit person", add_a_person: "Add a person", name_ph: "Name, for example Maya",
      picture: "Picture", picture_e: "Picture {e}", optional: "(optional)", dont_notify: "Don't notify", install_app: "Install the Home Assistant app on a phone to enable notifications.",
      save_changes: "Save changes", add_person: "Add person", notifies: "Notifies {x}", no_notifications: "No notifications", tap_remove: "Tap again to remove",
      remove: "Remove", no_one: "No one yet. Add the first person above.", ha_users: "Home Assistant users", show_ha: "Show Home Assistant users",
      ha_off: "Hidden. Turn on to also show people from Home Assistant.", from_ha: "From Home Assistant", type_name_err: "Please type a name.",
      cf_column: "Tile width", cf_group: "Group tiles: to do first, done last", default_title: "Tasks", stub_title: "Household tasks",
      new_task: "New task", all: "All", todo: "To do", done: "Done", coming_up: "Coming up", day_today: "today", day_tomorrow: "tomorrow",
      day_yesterday: "yesterday", sch_by: "{label} by {times}", every_day: "Every day", weekdays: "Weekdays", weekends: "Weekends",
      every_list: "Every {days}", every_n: "Every {n} days", twice: "Twice a day", n_times: "{n} times a day", st_done: "Done",
      st_overdue: "Overdue · was due {when}", st_due_by: "Due by {time}", st_due_today: "Due today", st_any_time: "Any time today",
      st_next: "Next: {when}", st_not_today: "Not due today", next_by: "next by {time}", stat_done: "done", stat_due: "due", stat_overdue: "overdue",
      stat_upcoming: "upcoming", everyone: "Everyone", job: "{name}'s job", everyones_job: "Everyone's job", someone: "Someone",
      dots: "{n} of {m} done today", details_for: "Details for {title}", setup_html: "Add the <b>Glass Task Board</b> integration in <b>Settings → Devices &amp; services → Add integration</b>, then reload this page.",
      cant_load: "Couldn't load tasks", welcome: "Welcome to your task board", all_done: "All done for now", fresh_lead: "Add the jobs your home repeats: feeding the pets, pills, bins night. Tap a tile when it's done and it resets on its own.",
      all_done_lead: "Nothing is due right now. Nice work.", no_match: "No tasks match this filter.", add_first: "Add your first task",
      nothing_due: "Nothing is due right now.", who_did: "Who did it?", history_settings: "History & settings", no_reminders: "No reminders",
      not_done_yet: "Not done yet.", mark_done: "Mark done", mark_again: "Mark done again", undo_last: "Undo last", edit_task: "Edit task",
      step_what: "What needs doing?", title_ph: "For example: Feed the dog", icon: "Icon", icon_e: "Icon {e}", step_often: "How often?",
      rep_daily: "Every day", rep_weekly: "Certain days", rep_every: "Every few days", fewer_days: "Fewer days", more_days: "More days",
      counted: "Counted from the last time it was done.", n_times_hint: "{n} times a day — once for each time below.", once_hint: "Once a day. Add a second time below for twice a day.",
      step_by: "Done by", any_time: "Any time that day.", remove_x: "Remove {x}", another_time: "Another time", add_time: "Add time",
      step_whose: "Whose job?", people_hint_html: "Add people with the <b>People</b> button to give someone a task.", more_opts: "More options: colour, reminders",
      remind_label: "Remind on phones when it's overdue", remind_aria: "Remind when overdue", save: "Save", add_task: "Add task",
      err_name: "Give the task a name.", err_day: "Pick at least one day.", q_morning: "Morning", q_noon: "Noon", q_evening: "Evening",
      q_bedtime: "Bedtime", pr_dog: "Feed the dog", pr_cat: "Feed the cat", pr_pills: "Morning pills", pr_bins: "Take out the bins",
      pr_plants: "Water the plants", pr_dishwasher: "Empty the dishwasher", pr_teeth: "Brush teeth", pr_bed: "Make the bed", background: "Background",
      look_lead: "Pick a colour theme for the board. It changes on every screen showing this board.", people_lead: "Add everyone who helps out. Tap their face to say who did a task, or give them tasks of their own.",
      notify_label: "Remind them on their phone when their task is overdue", on_board: "On the board", ha_on: "These people from Home Assistant are also on the board.",
    },
    de: {
      rep_once: "Einmalig", once_on: "Einmalig am {date}", st_on: "Am {when}", once_note: "Wird einmal erledigt. Danach verschwindet sie am nächsten Tag von der Tafel.", q_today: "Heute", q_tomorrow: "Morgen", pick_day: "Tag", err_date: "Wähle einen Tag.",
      alert_title: "Nicht vergessen", alert_one: "Diese Aufgabe ist überfällig.", alert_many: "{n} Aufgaben sind überfällig.", alert_done: "Erledigt", alert_snooze: "In {n} Min. erinnern", alert_ok: "Verstanden", cf_alert: "Überfällige Aufgaben auf diesem Bildschirm einblenden", cf_sound: "Beim Einblenden einen Ton abspielen", cf_snooze: "Erneut erinnern nach (Minuten)",
      bg_aurora: "Polarlicht", bg_black: "Schwarz", bg_sunset: "Sonnenuntergang", bg_ocean: "Ozean", bg_forest: "Wald", bg_lavender: "Lavendel",
      bg_ember: "Glut", bg_graphite: "Graphit", bg_midnight: "Mitternacht", bg_halloween: "Halloween", bg_festive: "Festlich",
      tint_clear: "klar", tint_rose: "rosa", tint_amber: "bernstein", tint_mint: "mint", tint_sky: "himmelblau", tint_violet: "violett",
      cf_title: "Titel", cf_height: "Höhe (CSS, z. B. 100vh oder 720px)", cf_ambient: "Ruhemodus nach (0 = aus)", cf_bgimg: "Adresse des Hintergrundbilds (optional)",
      cf_clock: "Uhr anzeigen", phone_app: "{name} (Handy-App)", home: "Zuhause", bg_colours: "Hintergrundfarben", people: "Personen",
      wake: "Zum Aufwecken irgendwo tippen", almost: "Fast geschafft", nothing_here: "Hier ist nichts", add_people: "Personen hinzufügen",
      close: "Schließen", colour: "Farbe", cancel: "Abbrechen", delete: "Löschen", tap_delete: "Zum Löschen erneut tippen", edit: "Bearbeiten",
      default: "Standard", own_colours: "Eigene Farben", colour_n: "Farbe {n}", look_hint_html: "Wenn du eine Farbe änderst, siehst du sie sofort. Wähle <b>Meine Farben verwenden</b>, um sie zu behalten.",
      in_use: "Aktiv", use_mine: "Meine Farben verwenden", edit_person: "Person bearbeiten", add_a_person: "Person hinzufügen",
      name_ph: "Name, zum Beispiel Maya", picture: "Bild", picture_e: "Bild {e}", optional: "(optional)", dont_notify: "Nicht benachrichtigen",
      install_app: "Installiere die Home Assistant App auf einem Handy, um Benachrichtigungen zu aktivieren.", save_changes: "Änderungen speichern",
      add_person: "Person hinzufügen", notifies: "Benachrichtigt {x}", no_notifications: "Keine Benachrichtigungen", tap_remove: "Zum Entfernen erneut tippen",
      remove: "Entfernen", no_one: "Noch niemand. Füge oben die erste Person hinzu.", ha_users: "Home Assistant Benutzer", show_ha: "Home Assistant Benutzer anzeigen",
      ha_off: "Ausgeblendet. Einschalten, um auch Personen aus Home Assistant zu zeigen.", from_ha: "Aus Home Assistant", type_name_err: "Bitte gib einen Namen ein.",
      cf_column: "Kachelbreite", cf_group: "Kacheln gruppieren: Offenes zuerst, Erledigtes zuletzt", default_title: "Aufgaben",
      stub_title: "Haushaltsaufgaben", new_task: "Neue Aufgabe", all: "Alle", todo: "Zu erledigen", done: "Erledigt", coming_up: "Demnächst",
      day_today: "heute", day_tomorrow: "morgen", day_yesterday: "gestern", sch_by: "{label} bis {times}", every_day: "Jeden Tag",
      weekdays: "Werktags", weekends: "Am Wochenende", every_list: "Jeden {days}", every_n: "Alle {n} Tage", twice: "Zweimal täglich",
      n_times: "{n}-mal täglich", st_done: "Erledigt", st_overdue: "Überfällig seit {when}", st_due_by: "Fällig bis {time}", st_due_today: "Heute fällig",
      st_any_time: "Irgendwann heute", st_next: "Nächstes Mal: {when}", st_not_today: "Heute nicht fällig", next_by: "nächstes Mal bis {time}",
      stat_done: "erledigt", stat_due: "fällig", stat_overdue: "überfällig", stat_upcoming: "demnächst", everyone: "Alle", job: "Aufgabe von {name}",
      everyones_job: "Aufgabe für alle", someone: "Jemand", dots: "{n} von {m} heute erledigt", details_for: "Details zu {title}",
      setup_html: "Füge die Integration <b>Glass Task Board</b> unter <b>Einstellungen → Geräte &amp; Dienste → Integration hinzufügen</b> hinzu und lade dann diese Seite neu.",
      cant_load: "Aufgaben konnten nicht geladen werden", welcome: "Willkommen bei deiner Aufgabentafel", all_done: "Fürs Erste alles erledigt",
      fresh_lead: "Füge die Aufgaben hinzu, die sich bei dir wiederholen: Haustiere füttern, Tabletten, Mülltonnen rausstellen. Tippe auf eine Kachel, wenn sie erledigt ist – sie setzt sich von selbst zurück.",
      all_done_lead: "Gerade ist nichts fällig. Gut gemacht.", no_match: "Keine Aufgaben passen zu diesem Filter.", add_first: "Erste Aufgabe hinzufügen",
      nothing_due: "Gerade ist nichts fällig.", who_did: "Wer hat es gemacht?", history_settings: "Verlauf & Einstellungen", no_reminders: "Keine Erinnerungen",
      not_done_yet: "Noch nicht erledigt.", mark_done: "Als erledigt markieren", mark_again: "Noch einmal erledigt", undo_last: "Letztes rückgängig",
      edit_task: "Aufgabe bearbeiten", step_what: "Was ist zu tun?", title_ph: "Zum Beispiel: Hund füttern", icon: "Symbol", icon_e: "Symbol {e}",
      step_often: "Wie oft?", rep_daily: "Jeden Tag", rep_weekly: "Bestimmte Tage", rep_every: "Alle paar Tage", fewer_days: "Weniger Tage",
      more_days: "Mehr Tage", counted: "Gezählt ab dem letzten Mal, als sie erledigt wurde.", n_times_hint: "{n}-mal täglich – einmal für jede Uhrzeit unten.",
      once_hint: "Einmal am Tag. Füge unten eine zweite Uhrzeit für zweimal täglich hinzu.", step_by: "Erledigt bis", any_time: "Irgendwann an dem Tag.",
      remove_x: "{x} entfernen", another_time: "Weitere Uhrzeit", add_time: "Uhrzeit hinzufügen", step_whose: "Wessen Aufgabe?",
      people_hint_html: "Füge mit der Schaltfläche <b>Personen</b> Leute hinzu, um jemandem eine Aufgabe zu geben.", more_opts: "Weitere Optionen: Farbe, Erinnerungen",
      remind_label: "Auf Handys erinnern, wenn sie überfällig ist", remind_aria: "Erinnern, wenn überfällig", save: "Speichern",
      add_task: "Aufgabe hinzufügen", err_name: "Gib der Aufgabe einen Namen.", err_day: "Wähle mindestens einen Tag.", q_morning: "Morgens",
      q_noon: "Mittags", q_evening: "Abends", q_bedtime: "Schlafenszeit", pr_dog: "Hund füttern", pr_cat: "Katze füttern", pr_pills: "Morgentabletten",
      pr_bins: "Mülltonnen rausstellen", pr_plants: "Pflanzen gießen", pr_dishwasher: "Spülmaschine ausräumen", pr_teeth: "Zähne putzen",
      pr_bed: "Bett machen", background: "Hintergrund", look_lead: "Wähle ein Farbthema für die Tafel. Es ändert sich auf jedem Bildschirm, der diese Tafel zeigt.",
      people_lead: "Füge alle hinzu, die mithelfen. Tippe auf ihr Gesicht, um zu sagen, wer eine Aufgabe erledigt hat, oder gib ihnen eigene Aufgaben.",
      notify_label: "Auf dem Handy erinnern, wenn ihre Aufgabe überfällig ist", on_board: "Auf der Tafel", ha_on: "Diese Personen aus Home Assistant sind auch auf der Tafel.",
    },
    es: {
      rep_once: "Una vez", once_on: "Una vez el {date}", st_on: "El {when}", once_note: "Se hace una sola vez. Cuando esté hecha, desaparece del tablero al día siguiente.", q_today: "Hoy", q_tomorrow: "Mañana", pick_day: "Día", err_date: "Elige un día.",
      alert_title: "No lo olvides", alert_one: "Esta tarea está atrasada.", alert_many: "Hay {n} tareas atrasadas.", alert_done: "Hecha", alert_snooze: "Recuérdamelo en {n} min", alert_ok: "Entendido", cf_alert: "Mostrar las tareas atrasadas en esta pantalla", cf_sound: "Hacer sonar un aviso al mostrarlas", cf_snooze: "Volver a recordar tras (minutos)",
      bg_aurora: "Aurora", bg_black: "Negro", bg_sunset: "Atardecer", bg_ocean: "Océano", bg_forest: "Bosque", bg_lavender: "Lavanda",
      bg_ember: "Brasa", bg_graphite: "Grafito", bg_midnight: "Medianoche", bg_halloween: "Halloween", bg_festive: "Festivo", tint_clear: "transparente",
      tint_rose: "rosa", tint_amber: "ámbar", tint_mint: "menta", tint_sky: "cielo", tint_violet: "violeta", cf_title: "Título",
      cf_height: "Altura (CSS, p. ej. 100vh o 720px)", cf_ambient: "Modo reposo tras (0 = nunca)", cf_bgimg: "Dirección de la imagen de fondo (opcional)",
      cf_clock: "Mostrar reloj", phone_app: "{name} (app del móvil)", home: "Casa", bg_colours: "Colores de fondo", people: "Personas",
      wake: "Toca en cualquier lugar para activar", almost: "Ya casi está", nothing_here: "No hay nada aquí", add_people: "Añadir personas",
      close: "Cerrar", colour: "Color", cancel: "Cancelar", delete: "Borrar", tap_delete: "Toca de nuevo para borrar", edit: "Editar",
      default: "Predeterminado", own_colours: "Tus propios colores", colour_n: "Color {n}", look_hint_html: "Al cambiar un color lo ves al momento. Selecciona <b>Usar mis colores</b> para mantenerlo.",
      in_use: "En uso", use_mine: "Usar mis colores", edit_person: "Editar persona", add_a_person: "Añadir una persona", name_ph: "Nombre, por ejemplo Maya",
      picture: "Imagen", picture_e: "Imagen {e}", optional: "(opcional)", dont_notify: "No avisar", install_app: "Instala la app de Home Assistant en un móvil para activar las notificaciones.",
      save_changes: "Guardar cambios", add_person: "Añadir persona", notifies: "Avisa a {x}", no_notifications: "Sin notificaciones",
      tap_remove: "Toca de nuevo para quitar", remove: "Quitar", no_one: "Aún no hay nadie. Añade arriba a la primera persona.",
      ha_users: "Usuarios de Home Assistant", show_ha: "Mostrar usuarios de Home Assistant", ha_off: "Ocultas. Actívalo para mostrar también a las personas de Home Assistant.",
      from_ha: "De Home Assistant", type_name_err: "Escribe un nombre.", cf_column: "Ancho de las fichas", cf_group: "Agrupar fichas: pendientes primero, hechas al final",
      default_title: "Tareas", stub_title: "Tareas de casa", new_task: "Nueva tarea", all: "Todas", todo: "Pendientes", done: "Hechas",
      coming_up: "Próximamente", day_today: "hoy", day_tomorrow: "mañana", day_yesterday: "ayer", sch_by: "{label} antes de {times}",
      every_day: "Todos los días", weekdays: "Entre semana", weekends: "Fines de semana", every_list: "Cada {days}", every_n: "Cada {n} días",
      twice: "Dos veces al día", n_times: "{n} veces al día", st_done: "Hecha", st_overdue: "Atrasada desde {when}", st_due_by: "Antes de {time}",
      st_due_today: "Toca hoy", st_any_time: "Cuando sea hoy", st_next: "Próxima: {when}", st_not_today: "Hoy no toca", next_by: "la próxima antes de {time}",
      stat_done: "hecha", stat_due: "pendiente", stat_overdue: "atrasada", stat_upcoming: "próxima", everyone: "Todos", job: "Tarea de {name}",
      everyones_job: "Tarea de todos", someone: "Alguien", dots: "{n} de {m} hechas hoy", details_for: "Detalles de {title}", setup_html: "Añade la integración <b>Glass Task Board</b> en <b>Ajustes → Dispositivos y servicios → Añadir integración</b> y vuelve a cargar esta página.",
      cant_load: "No se pudieron cargar las tareas", welcome: "Te damos la bienvenida a tu tablero de tareas", all_done: "Todo hecho por ahora",
      fresh_lead: "Añade las tareas que se repiten en casa: dar de comer a las mascotas, las pastillas, sacar la basura. Toca una ficha cuando esté hecha y se reinicia sola.",
      all_done_lead: "Ahora no toca nada. ¡Buen trabajo!", no_match: "Ninguna tarea coincide con este filtro.", add_first: "Añade tu primera tarea",
      nothing_due: "Ahora no toca nada.", who_did: "¿Quién lo hizo?", history_settings: "Historial y ajustes", no_reminders: "Sin recordatorios",
      not_done_yet: "Aún no se ha hecho.", mark_done: "Marcar como hecha", mark_again: "Marcar como hecha otra vez", undo_last: "Deshacer la última",
      edit_task: "Editar tarea", step_what: "¿Qué hay que hacer?", title_ph: "Por ejemplo: Dar de comer al perro", icon: "Icono",
      icon_e: "Icono {e}", step_often: "¿Cada cuánto?", rep_daily: "Todos los días", rep_weekly: "Ciertos días", rep_every: "Cada pocos días",
      fewer_days: "Menos días", more_days: "Más días", counted: "Se cuenta desde la última vez que se hizo.", n_times_hint: "{n} veces al día: una por cada hora de abajo.",
      once_hint: "Una vez al día. Añade una segunda hora abajo para dos veces al día.", step_by: "Hecha antes de", any_time: "Cuando sea ese día.",
      remove_x: "Quitar {x}", another_time: "Otra hora", add_time: "Añadir hora", step_whose: "¿De quién es la tarea?", people_hint_html: "Añade personas con el botón <b>Personas</b> para darle una tarea a alguien.",
      more_opts: "Más opciones: color, recordatorios", remind_label: "Avisar en los móviles cuando esté atrasada", remind_aria: "Avisar cuando esté atrasada",
      save: "Guardar", add_task: "Añadir tarea", err_name: "Ponle un nombre a la tarea.", err_day: "Elige al menos un día.", q_morning: "Mañana",
      q_noon: "Mediodía", q_evening: "Tarde", q_bedtime: "Hora de dormir", pr_dog: "Dar de comer al perro", pr_cat: "Dar de comer al gato",
      pr_pills: "Pastillas de la mañana", pr_bins: "Sacar la basura", pr_plants: "Regar las plantas", pr_dishwasher: "Vaciar el lavavajillas",
      pr_teeth: "Lavarse los dientes", pr_bed: "Hacer la cama", background: "Fondo", look_lead: "Elige un tema de color para el tablero. Cambia en todas las pantallas que muestran este tablero.",
      people_lead: "Añade a todas las personas que ayudan. Toca su cara para decir quién hizo una tarea o dales tareas propias.",
      notify_label: "Avisar en su móvil cuando su tarea esté atrasada", on_board: "En el tablero", ha_on: "Estas personas de Home Assistant también están en el tablero.",
    },
    fr: {
      rep_once: "Une fois", once_on: "Une fois le {date}", st_on: "Le {when}", once_note: "Elle se fait une seule fois. Une fois faite, elle quitte le tableau le lendemain.", q_today: "Aujourd'hui", q_tomorrow: "Demain", pick_day: "Jour", err_date: "Choisissez un jour.",
      alert_title: "N'oubliez pas", alert_one: "Cette tâche est en retard.", alert_many: "{n} tâches sont en retard.", alert_done: "Fait", alert_snooze: "Me le rappeler dans {n} min", alert_ok: "Compris", cf_alert: "Afficher les tâches en retard sur cet écran", cf_sound: "Jouer un carillon à l'affichage", cf_snooze: "Rappeler à nouveau après (minutes)",
      bg_aurora: "Aurore", bg_black: "Noir", bg_sunset: "Coucher de soleil", bg_ocean: "Océan", bg_forest: "Forêt", bg_lavender: "Lavande",
      bg_ember: "Braise", bg_graphite: "Graphite", bg_midnight: "Minuit", bg_halloween: "Halloween", bg_festive: "Festif", tint_clear: "transparent",
      tint_rose: "rose", tint_amber: "ambre", tint_mint: "menthe", tint_sky: "ciel", tint_violet: "violet", cf_title: "Titre",
      cf_height: "Hauteur (CSS, par ex. 100vh ou 720px)", cf_ambient: "Mode veille après (0 = jamais)", cf_bgimg: "Adresse de l'image de fond (facultatif)",
      cf_clock: "Afficher l'horloge", phone_app: "{name} (appli mobile)", home: "Maison", bg_colours: "Couleurs de fond", people: "Personnes",
      wake: "Touchez n'importe où pour réveiller", almost: "Presque terminé", nothing_here: "Rien ici", add_people: "Ajouter des personnes",
      close: "Fermer", colour: "Couleur", cancel: "Annuler", delete: "Supprimer", tap_delete: "Touchez à nouveau pour supprimer",
      edit: "Modifier", default: "Par défaut", own_colours: "Vos propres couleurs", colour_n: "Couleur {n}", look_hint_html: "Changer une couleur l'affiche aussitôt. Sélectionnez <b>Utiliser mes couleurs</b> pour la garder.",
      in_use: "Utilisé", use_mine: "Utiliser mes couleurs", edit_person: "Modifier la personne", add_a_person: "Ajouter une personne",
      name_ph: "Nom, par exemple Maya", picture: "Image", picture_e: "Image {e}", optional: "(facultatif)", dont_notify: "Ne pas notifier",
      install_app: "Installez l'application Home Assistant sur un téléphone pour activer les notifications.", save_changes: "Enregistrer",
      add_person: "Ajouter la personne", notifies: "Notifie {x}", no_notifications: "Aucune notification", tap_remove: "Touchez à nouveau pour retirer",
      remove: "Retirer", no_one: "Personne pour l'instant. Ajoutez la première personne ci-dessus.", ha_users: "Utilisateurs de Home Assistant",
      show_ha: "Afficher les utilisateurs de Home Assistant", ha_off: "Masquées. Activez pour afficher aussi les personnes de Home Assistant.",
      from_ha: "Depuis Home Assistant", type_name_err: "Veuillez saisir un nom.", cf_column: "Largeur des tuiles", cf_group: "Grouper les tuiles : à faire d'abord, faites à la fin",
      default_title: "Tâches", stub_title: "Tâches de la maison", new_task: "Nouvelle tâche", all: "Toutes", todo: "À faire", done: "Faites",
      coming_up: "À venir", day_today: "aujourd'hui", day_tomorrow: "demain", day_yesterday: "hier", sch_by: "{label} avant {times}",
      every_day: "Tous les jours", weekdays: "En semaine", weekends: "Le week-end", every_list: "Chaque {days}", every_n: "Tous les {n} jours",
      twice: "Deux fois par jour", n_times: "{n} fois par jour", st_done: "Fait", st_overdue: "En retard depuis {when}", st_due_by: "Avant {time}",
      st_due_today: "À faire aujourd'hui", st_any_time: "N'importe quand aujourd'hui", st_next: "Prochaine : {when}", st_not_today: "Rien aujourd'hui",
      next_by: "prochaine avant {time}", stat_done: "faite", stat_due: "à faire", stat_overdue: "en retard", stat_upcoming: "à venir",
      everyone: "Tout le monde", job: "Tâche de {name}", everyones_job: "Tâche de tout le monde", someone: "Quelqu'un", dots: "{n} sur {m} faites aujourd'hui",
      details_for: "Détails de {title}", setup_html: "Ajoutez l'intégration <b>Glass Task Board</b> dans <b>Paramètres → Appareils et services → Ajouter une intégration</b>, puis rechargez cette page.",
      cant_load: "Impossible de charger les tâches", welcome: "Bienvenue sur votre tableau des tâches", all_done: "Tout est fait pour l'instant",
      fresh_lead: "Ajoutez les tâches qui reviennent à la maison : nourrir les animaux, les médicaments, sortir les poubelles. Touchez une tuile quand c'est fait : elle se réinitialise toute seule.",
      all_done_lead: "Rien à faire pour le moment. Bravo !", no_match: "Aucune tâche ne correspond à ce filtre.", add_first: "Ajouter votre première tâche",
      nothing_due: "Rien à faire pour le moment.", who_did: "Qui l'a fait ?", history_settings: "Historique et réglages", no_reminders: "Pas de rappels",
      not_done_yet: "Pas encore fait.", mark_done: "Marquer comme fait", mark_again: "Marquer à nouveau comme fait", undo_last: "Annuler le dernier",
      edit_task: "Modifier la tâche", step_what: "Que faut-il faire ?", title_ph: "Par exemple : Nourrir le chien", icon: "Icône",
      icon_e: "Icône {e}", step_often: "À quelle fréquence ?", rep_daily: "Tous les jours", rep_weekly: "Certains jours", rep_every: "Tous les quelques jours",
      fewer_days: "Moins de jours", more_days: "Plus de jours", counted: "Compté depuis la dernière fois que c'était fait.", n_times_hint: "{n} fois par jour : une fois pour chaque heure ci-dessous.",
      once_hint: "Une fois par jour. Ajoutez une deuxième heure ci-dessous pour deux fois par jour.", step_by: "Fait avant", any_time: "N'importe quand ce jour-là.",
      remove_x: "Retirer {x}", another_time: "Autre heure", add_time: "Ajouter l'heure", step_whose: "Qui s'en charge ?", people_hint_html: "Ajoutez des personnes avec le bouton <b>Personnes</b> pour confier une tâche à quelqu'un.",
      more_opts: "Plus d'options : couleur, rappels", remind_label: "Rappeler sur les téléphones quand c'est en retard", remind_aria: "Rappeler en cas de retard",
      save: "Enregistrer", add_task: "Ajouter la tâche", err_name: "Donnez un nom à la tâche.", err_day: "Choisissez au moins un jour.",
      q_morning: "Matin", q_noon: "Midi", q_evening: "Soir", q_bedtime: "Coucher", pr_dog: "Nourrir le chien", pr_cat: "Nourrir le chat",
      pr_pills: "Médicaments du matin", pr_bins: "Sortir les poubelles", pr_plants: "Arroser les plantes", pr_dishwasher: "Vider le lave-vaisselle",
      pr_teeth: "Se brosser les dents", pr_bed: "Faire le lit", background: "Fond", look_lead: "Choisissez un thème de couleur pour le tableau. Il change sur chaque écran qui affiche ce tableau.",
      people_lead: "Ajoutez toutes les personnes qui participent. Touchez leur visage pour dire qui a fait une tâche, ou confiez-leur leurs propres tâches.",
      notify_label: "Rappel sur son téléphone quand sa tâche est en retard", on_board: "Sur le tableau", ha_on: "Ces personnes de Home Assistant sont aussi sur le tableau.",
    },
  };
  const langOf = (hass) =>
    String((hass && ((hass.locale && hass.locale.language) || hass.language)) || navigator.language || "en").slice(0, 2).toLowerCase();
  const pageLang = () => langOf(document.querySelector("home-assistant") && document.querySelector("home-assistant").hass);
  const tr = (lang, key, vars) => {
    const table = STRINGS[lang] || STRINGS.en;
    let s = table[key] ?? STRINGS.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
    return s;
  };

  // Background themes: base colour plus three glow colours. Aurora is the default.
  const BACKGROUNDS = {
    aurora: { base: "#070b1c", colors: ["#5b6cff", "#ff5fa2", "#22d3c5"] },
    black: { base: "#000000", colors: ["#2c2c30", "#1f1f24", "#3a3a40"] },
    sunset: { base: "#1a0a10", colors: ["#ff7a45", "#ff3d77", "#ffc15e"] },
    ocean: { base: "#021321", colors: ["#1e88e5", "#00bcd4", "#5c6bc0"] },
    forest: { base: "#06130c", colors: ["#43a047", "#9ccc65", "#00897b"] },
    lavender: { base: "#110c1d", colors: ["#9575cd", "#f48fb1", "#7986cb"] },
    ember: { base: "#150806", colors: ["#ff5722", "#ffa000", "#d81b60"] },
    graphite: { base: "#0b0d10", colors: ["#78909c", "#b0bec5", "#455a64"] },
    midnight: { base: "#04050b", colors: ["#283593", "#1565c0", "#4a148c"] },
    halloween: { base: "#0c0610", colors: ["#ff6d00", "#8e24aa", "#43a047"] },
    festive: { base: "#0a1210", colors: ["#e53935", "#43a047", "#fdd835"] },
  };
  const DEFAULT_BACKGROUND = "aurora";
  const darkBase = (hex) => {
    const n = parseInt(String(hex).slice(1), 16);
    if (Number.isNaN(n)) return BACKGROUNDS.aurora.base;
    const mix = (c) => Math.round(c * 0.1 + 6);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  };
  const LAST_DOER_KEY = "glass-task-board:last-doer";
  const ALERT_KEY = "glass-task-board:alert-";
  const storage = {
    get(k) {
      try {
        return window.localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        window.localStorage.setItem(k, v);
      } catch (e) {
        /* storage unavailable */
      }
    },
  };

  // A local calendar day as YYYY-MM-DD, `offset` days from today.
  const isoDay = (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const initials = (name) =>
    String(name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?";

  const ICON = {
    pin: '<svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M12.5 8c-2.6 0-5 1-6.9 2.6L2 7v9h9l-3.6-3.6A8 8 0 0 1 20.1 16l2.4-.8A10.5 10.5 0 0 0 12.5 8z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
    reply: '<svg viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
    people: '<svg viewBox="0 0 24 24"><path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1a4.2 4.2 0 0 1 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z"/></svg>',
    palette: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0 0 18 1.5 1.5 0 0 0 1.1-2.5 1.5 1.5 0 0 1 1.1-2.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8zm-5.5 9A1.5 1.5 0 1 1 8 10.5 1.5 1.5 0 0 1 6.5 12zm3-4A1.5 1.5 0 1 1 11 6.5 1.5 1.5 0 0 1 9.5 8zm5 0A1.5 1.5 0 1 1 16 6.5 1.5 1.5 0 0 1 14.5 8zm3 4a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M3 17.3V21h3.8l11-11.1-3.7-3.7zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.7 3.7z"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>',
    dots: '<svg viewBox="0 0 24 24"><path d="M12 8a2 2 0 1 0-2-2 2 2 0 0 0 2 2zm0 2a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm0 6a2 2 0 1 0 2 2 2 2 0 0 0-2-2z"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7z"/></svg>',
  };

  const STYLE = `
  :host { display:block; --gm-radius: 26px; --gm-text: #f4f7ff; --gm-dim: rgba(244,247,255,.66);
    font-family: var(--paper-font-body1_-_font-family, "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif); }
  * { box-sizing:border-box; }
  button { font:inherit; color:inherit; cursor:pointer; border:0; background:none; -webkit-tap-highlight-color:transparent; }
  svg { width:1em; height:1em; fill:currentColor; flex:none; }
  .root { position:relative; overflow:hidden; border-radius: var(--ha-card-border-radius, 18px);
    color: var(--gm-text); background: var(--gm-base, #070b1c); transition: background-color 1s ease; min-height: var(--gm-height); height: var(--gm-height); isolation:isolate; }

  /* aurora */
  .aurora { position:absolute; inset:-20%; z-index:-1; filter: blur(70px) saturate(140%); }
  .aurora i { position:absolute; border-radius:50%; opacity:.75; mix-blend-mode:screen; animation: drift 28s ease-in-out infinite alternate; }
  .aurora .b1 { width:60%; height:60%; left:5%; top:5%; background: radial-gradient(circle, var(--gm-c1, #5b6cff) 0%, transparent 65%); }
  .aurora .b2 { width:55%; height:65%; right:0; top:20%; background: radial-gradient(circle, var(--gm-c2, #ff5fa2) 0%, transparent 65%); animation-duration: 34s; animation-delay:-8s; }
  .aurora .b3 { width:70%; height:55%; left:20%; bottom:-5%; background: radial-gradient(circle, var(--gm-c3, #22d3c5) 0%, transparent 65%); animation-duration: 40s; animation-delay:-16s; }
  .bgimg { position:absolute; inset:0; z-index:-1; background-size:cover; background-position:center; opacity:.85; }
  .grain { position:absolute; inset:0; z-index:-1; opacity:.06; pointer-events:none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  @keyframes drift { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(8%, -6%) scale(1.12); } 100% { transform: translate(-6%, 7%) scale(.95); } }

  /* glass */
  .glass { position:relative; border-radius: var(--gm-radius);
    background: linear-gradient(140deg, rgba(var(--tint, 255,255,255), .20), rgba(var(--tint,255,255,255), .06) 60%, rgba(var(--tint,255,255,255), .10));
    -webkit-backdrop-filter: blur(24px) saturate(170%); backdrop-filter: blur(24px) saturate(170%);
    border: 1px solid rgba(255,255,255,.22);
    box-shadow: 0 18px 50px -18px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.38), inset 0 -1px 0 rgba(255,255,255,.06); }
  .glass::before { content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
    background: linear-gradient(115deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 32%); mix-blend-mode: overlay; }

  .ui { position:absolute; inset:0; display:flex; flex-direction:column; padding: clamp(14px, 2.2vw, 28px); gap: clamp(14px, 2vw, 22px);
    transition: opacity .8s ease, filter .8s ease, transform .8s ease; }
  .ambient-on .ui { opacity:0; filter: blur(12px); transform: scale(.98); pointer-events:none; }

  header { display:flex; align-items:center; gap:18px; padding: 14px 18px 14px 24px; flex-wrap:wrap; }
  .clock { display:flex; flex-direction:column; line-height:1; min-width: 7ch; }
  .time { font-size: clamp(30px, 4.2vw, 50px); font-weight:250; letter-spacing:-.02em; font-variant-numeric: tabular-nums; }
  .date { font-size: 13px; color: var(--gm-dim); margin-top:6px; letter-spacing:.04em; text-transform: uppercase; }
  .title { font-size: 15px; color: var(--gm-dim); font-weight:500; padding-left:18px; border-left: 1px solid rgba(255,255,255,.18); align-self:stretch; display:flex; align-items:center; }
  .filters { display:flex; gap:8px; flex:1; justify-content:flex-end; flex-wrap:wrap; align-items:center; }
  .chip { display:inline-flex; align-items:center; gap:8px; padding: 7px 14px 7px 8px; border-radius: 999px; font-size: 14px; min-height:40px;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); transition: background .2s, border-color .2s, transform .15s; }
  .chip.text { padding: 7px 16px; }
  .filters .chip.text { flex-shrink: 0; }
  .chip:active { transform: scale(.96); }
  .chip.on { background: rgba(255,255,255,.26); border-color: rgba(255,255,255,.55); box-shadow: inset 0 1px 0 rgba(255,255,255,.4); }
  .chip .n { font-size: 11px; background: rgba(255,255,255,.22); border-radius: 999px; padding: 1px 7px; }
  .new { display:inline-flex; align-items:center; gap:8px; padding: 12px 22px; border-radius:999px; font-weight:600; font-size:15px;
    background: linear-gradient(135deg, rgba(255,255,255,.95), rgba(225,232,255,.85)); color:#121735; box-shadow: 0 10px 30px -8px rgba(120,140,255,.7); }
  .new svg { font-size:20px; }

  .avatar { width:32px; height:32px; border-radius:50%; flex:none; display:grid; place-items:center; font-size:13px; font-weight:600; overflow:hidden;
    background: linear-gradient(135deg, hsl(var(--h) 80% 65%), hsl(calc(var(--h) + 40) 80% 50%)); color:#fff; border: 1.5px solid rgba(255,255,255,.55); }
  .avatar img { width:100%; height:100%; object-fit:cover; }
  .avatar.lg { width:44px; height:44px; font-size:16px; }
  .avatar.home { --h: 210; }

  main { flex:1; overflow-y:auto; overflow-x:hidden; margin: 0 -8px; padding: 8px 8px 40px; scrollbar-width: none;
    -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 40px), transparent); mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 40px), transparent); }
  main::-webkit-scrollbar { display:none; }
  .empty, .problem { max-width: 520px; margin: 8vh auto 0; padding: 36px; text-align:center; }
  .empty h2, .problem h2 { margin: 0 0 8px; font-weight:500; font-size: 24px; }
  .empty p, .problem p { margin:0; color: var(--gm-dim); line-height:1.5; }
  .empty .big { font-size: 46px; margin-bottom: 10px; }

  /* overlays */
  .scrim { position:absolute; inset:0; z-index:5; display:grid; place-items:center; padding: 16px; background: rgba(5,8,24,.35);
    -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); animation: fade .25s ease both; }
  .scrim[hidden] { display:none; }
  @keyframes fade { from { opacity:0; } }
  .sheet { width: min(760px, 100%); max-height: 100%; overflow:auto; padding: 22px 26px 24px; animation: pop .35s cubic-bezier(.2,.9,.25,1.1) both; scrollbar-width:none; }
  @keyframes pop { from { opacity:0; transform: translateY(24px) scale(.97); } }
  .settled { animation: none !important; }
  .sheet-head { display:flex; align-items:center; justify-content:space-between; margin-bottom: 14px; }
  .sheet-head h2 { margin:0; font-weight:500; font-size: 24px; }
  .icon-btn { width:44px; height:44px; border-radius:50%; display:grid; place-items:center; font-size:22px; background: rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.16); }
  .icon-btn.on { background: #ff4f7b; border-color: transparent; animation: pulse 1.4s ease infinite; }
  @keyframes pulse { 50% { box-shadow: 0 0 0 10px rgba(255,79,123,0); } 0% { box-shadow: 0 0 0 0 rgba(255,79,123,.6); } }
  .row { display:flex; align-items:center; gap:12px; margin: 12px 0; flex-wrap:wrap; }
  .row > label { width: 54px; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color: var(--gm-dim); }
  .row .chips { display:flex; gap:8px; flex-wrap:wrap; flex:1; }
  .tabs { display:inline-flex; flex-wrap:wrap; max-width:100%; padding:4px; border-radius:24px; background: rgba(0,0,0,.2); margin: 8px 0 12px; }
  .tabs button { padding: 9px 20px; border-radius:999px; font-size:14px; color: var(--gm-dim); }
  .tabs button.on { background: rgba(255,255,255,.22); color: var(--gm-text); }
  .emoji { font-size: 22px; width:40px; height:40px; border-radius:12px; display:grid; place-items:center; }
  .emoji:hover, .emoji:active { background: rgba(255,255,255,.14); }
  .tint-dot { width:34px; height:34px; border-radius:50%; border:2px solid rgba(255,255,255,.3);
    background: linear-gradient(135deg, rgba(var(--tint),.9), rgba(var(--tint),.35)); }
  .tint-dot.on { border-color:#fff; box-shadow: 0 0 0 3px rgba(255,255,255,.25); }
  .sheet-foot { display:flex; align-items:center; gap:12px; margin-top: 18px; }
  .editor-scrim .sheet-foot { position: sticky; bottom: -24px; margin: 12px -26px -24px; padding: 14px 26px 20px;
    background: linear-gradient(to top, rgba(14,18,44,.92) 55%, rgba(14,18,44,0));
    background: linear-gradient(to top, color-mix(in srgb, var(--gm-base, #070b1c) 88%, transparent) 55%, transparent); border-radius: 0 0 var(--gm-radius) var(--gm-radius); }
  .err { color: #ffb3c4; font-size:14px; flex:1; }
  .primary { display:inline-flex; align-items:center; gap:10px; padding: 14px 28px; border-radius:999px; font-weight:600; font-size:16px;
    background: linear-gradient(135deg, #fff, #dfe5ff); color:#121735; box-shadow: 0 10px 30px -8px rgba(120,140,255,.8); }
  .primary[disabled] { opacity:.45; box-shadow:none; }
  .detail { width: min(640px, 100%); padding: 26px 28px; animation: pop .35s cubic-bezier(.2,.9,.25,1.1) both; max-height:100%; overflow:auto; }
  .detail .text { font-size: 26px; }
  .detail .text.xl { font-size: 40px; }
  .actions { display:flex; gap:10px; margin-top: 18px; flex-wrap:wrap; }
  .actions button { display:inline-flex; align-items:center; gap:8px; padding: 11px 18px; border-radius:999px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); font-size:15px; }
  .actions button.danger { color:#ffc2d1; }
  .actions svg { font-size:18px; }

  /* overdue pop-up */
  .alert-scrim { z-index: 8; background: rgba(28,4,14,.5); }
  /* The glow breathes on a separate layer that ignores touches. The scrolling box itself never
     animates: iPad Safari can drop taps inside a scrolling element that keeps animating. */
  .od-wrap { position:relative; width: min(640px, 100%); max-height:100%; display:flex; border-radius: var(--gm-radius);
    animation: pop .35s cubic-bezier(.2,.9,.25,1.1) both; }
  .od-wrap.settled { animation:none; }
  .od-wrap::after { content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
    box-shadow: 0 0 0 1.5px rgba(${OVERDUE_TINT}, .75), 0 0 46px -8px rgba(${OVERDUE_TINT}, .85); animation: breathe 2.6s ease-in-out .35s infinite; }
  @keyframes breathe { 50% { opacity:.3; } }
  .od-alert { width:100%; max-height:100%; overflow:auto; -webkit-overflow-scrolling: touch; padding: 28px 28px 22px; text-align:center; scrollbar-width:none;
    border-color: rgba(${OVERDUE_TINT}, .55); }
  .od-alert .bell { font-size: 56px; line-height:1; display:inline-block; animation: ring 1.4s ease-in-out .3s 2; }
  .od-alert h2 { margin: 12px 0 4px; font-size: 30px; font-weight:600; }
  .od-alert .lead { margin:0; }
  @keyframes ring { 0%, 100% { transform: rotate(0); } 15% { transform: rotate(16deg); } 30% { transform: rotate(-14deg); } 45% { transform: rotate(10deg); } 60% { transform: rotate(-6deg); } 75% { transform: rotate(3deg); } }
  .alert-list { list-style:none; margin: 20px 0 0; padding:0; display:grid; gap:10px; text-align:left; }
  .alert-list li { display:flex; align-items:center; gap:14px; padding: 12px 12px 12px 14px; border-radius: 22px;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.16); }
  .alert-list .t-icon { width:52px; height:52px; font-size:32px; flex:none; }
  .alert-list .t-body { flex:1; min-width:0; }
  .alert-list .t-title { font-size: 19px; }
  .od-alert .sheet-foot { justify-content:flex-end; flex-wrap:wrap; }
  .primary.sm { padding: 11px 20px; font-size:15px; flex:none; }

  /* ambient */
  .ambient { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 6vh 6vw; text-align:center;
    opacity:0; pointer-events:none; transition: opacity 1.2s ease; }
  .ambient-on .ambient { opacity:1; pointer-events:auto; cursor:pointer; }
  .a-time { font-size: clamp(80px, 15vw, 190px); font-weight: 200; letter-spacing:-.04em; line-height:.9; font-variant-numeric: tabular-nums; text-shadow: 0 10px 60px rgba(0,0,0,.25); }
  .a-date { font-size: clamp(16px, 2vw, 24px); color: var(--gm-dim); margin-top: 10px; letter-spacing:.08em; text-transform: uppercase; }
  .a-spot { margin-top: 6vh; width: min(680px, 90%); padding: 24px 30px; text-align:left; transition: opacity .8s ease, transform .8s ease; }
  .a-spot.out { opacity:0; transform: translateY(12px); }
  .a-spot .text { font-size: clamp(22px, 2.6vw, 32px); }
  .a-hint { position:absolute; bottom: 24px; font-size:13px; color: rgba(255,255,255,.4); letter-spacing:.1em; text-transform: uppercase; }

  .ghost-btn { display:inline-flex; align-items:center; gap:8px; padding: 12px 18px; border-radius:999px; font-size:15px; font-weight:500;
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); }
  .ghost-btn svg { font-size:20px; }
  .empty .cta { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top: 20px; }
  /* steps + tiles */
  .step { margin: 18px 0 6px; }
  .step-h { display:flex; align-items:center; gap:10px; margin: 0 0 10px; font-size: 15px; font-weight:600; }
  .step-h i { font-style:normal; width:26px; height:26px; border-radius:50%; display:grid; place-items:center; font-size:13px;
    background: rgba(255,255,255,.9); color:#121735; }
  .step-h small { font-weight:400; color: var(--gm-dim); font-size: 13px; }
  .tiles { display:grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap:10px; }
  .tile { display:flex; flex-direction:column; align-items:center; gap:8px; padding: 12px 6px 10px; border-radius: 20px; min-width:0;
    background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); font-size:14px; transition: background .2s, border-color .2s, transform .15s; }
  .tile span:last-child { max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tile:active { transform: scale(.96); }
  .tile.on { background: rgba(255,255,255,.26); border-color: rgba(255,255,255,.65); box-shadow: inset 0 1px 0 rgba(255,255,255,.4); }
  .tile .avatar { width:54px; height:54px; font-size: 26px; }
  .tile.add { color: var(--gm-dim); }
  .tile.add .ring { width:54px; height:54px; border-radius:50%; display:grid; place-items:center; font-size:24px; border: 1.5px dashed rgba(255,255,255,.5); }
  .everyone-av { width:54px; height:54px; border-radius:50%; display:grid; place-items:center; font-size:26px;
    background: linear-gradient(135deg, rgba(255,255,255,.35), rgba(255,255,255,.1)); border: 1.5px solid rgba(255,255,255,.55); }
  .quick-add { grid-column: 1 / -1; display:flex; gap:8px; align-items:center; padding: 8px; border-radius: 20px; background: rgba(0,0,0,.2); border:1px solid rgba(255,255,255,.2); }
  .field { flex:1; min-width:0; height: 52px; border-radius: 16px; padding: 0 16px; font: inherit; font-size: 18px; color: var(--gm-text);
    background: rgba(0,0,0,.2); border: 1px solid rgba(255,255,255,.18); outline:none; }
  .field:focus { border-color: rgba(255,255,255,.55); }
  .field::placeholder { color: rgba(255,255,255,.4); }
  select.field { appearance:none; -webkit-appearance:none; font-size:16px; cursor:pointer;
    background-image: linear-gradient(45deg, transparent 50%, rgba(255,255,255,.7) 50%), linear-gradient(135deg, rgba(255,255,255,.7) 50%, transparent 50%);
    background-position: calc(100% - 22px) 23px, calc(100% - 16px) 23px; background-size: 6px 6px; background-repeat:no-repeat; padding-right: 40px; }
  select.field option { color:#121735; }
  .small-btn { padding: 0 18px; height: 44px; border-radius: 999px; font-weight:600; background:#fff; color:#121735; }
  .more { display:inline-flex; align-items:center; gap:6px; margin-top: 16px; font-size:14px; color: var(--gm-dim); padding: 6px 0; }
  .more svg { transition: transform .2s; font-size:18px; }
  .more.open svg { transform: rotate(90deg); }

  /* people panel */
  .lead { margin: -4px 0 16px; color: var(--gm-dim); line-height:1.5; }
  .card-inset { padding: 18px; border-radius: 22px; background: rgba(0,0,0,.18); border: 1px solid rgba(255,255,255,.12); }
  .card-inset h3, .people-sec h3 { margin: 0 0 12px; font-size: 13px; letter-spacing:.08em; text-transform:uppercase; color: var(--gm-dim); font-weight:600; }
  .pform-top { display:flex; gap:14px; align-items:center; }
  .avatar.xl { width:64px; height:64px; font-size:32px; }
  .label { margin: 16px 0 8px; font-size:13px; color: var(--gm-dim); }
  .label .opt { opacity:.7; font-style: italic; }
  .emoji-grid { display:flex; flex-wrap:wrap; gap:4px; }
  .emoji.on { background: rgba(255,255,255,.26); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.7); }
  .hues { display:flex; gap:10px; flex-wrap:wrap; }
  .hue { width:36px; height:36px; border-radius:50%; border:2px solid rgba(255,255,255,.3);
    background: linear-gradient(135deg, hsl(var(--h) 80% 65%), hsl(calc(var(--h) + 40) 80% 50%)); }
  .hue.on { border-color:#fff; box-shadow: 0 0 0 3px rgba(255,255,255,.25); }
  .pform-foot { display:flex; align-items:center; gap:10px; margin-top: 18px; flex-wrap:wrap; }
  .people-sec { margin-top: 22px; }
  .person-row { display:flex; align-items:center; gap:12px; padding: 10px 6px; border-top: 1px solid rgba(255,255,255,.1); }
  .person-row .pinfo { flex:1; min-width:0; }
  .person-row b { display:block; font-weight:500; font-size:16px; }
  .person-row small { color: var(--gm-dim); font-size: 13px; }
  .person-row .ghost-btn { padding: 8px 14px; font-size:14px; }
  .person-row .ghost-btn.danger, .ghost-btn.danger { color:#ffc2d1; }
  .muted { color: var(--gm-dim); margin: 4px 0 0; }
  .switch { position:relative; width:52px; height:30px; border-radius:999px; background: rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.25); flex:none; }
  .switch::after { content:""; position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:#fff; transition: transform .2s; }
  .switch.on { background: #6e7cff; }
  .switch.on::after { transform: translateX(22px); }
  .sec-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .sec-head h3 { margin:0; }

  /* background picker */
  .icon-only { width:44px; height:44px; padding:0; justify-content:center; }
  .bg-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap:12px; }
  .bg-opt { display:flex; flex-direction:column; gap:8px; padding:8px 8px 10px; border-radius:20px; text-align:left; font-size:14px;
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); transition: border-color .2s, background .2s; }
  .bg-opt.on { background: rgba(255,255,255,.18); border-color: rgba(255,255,255,.7); }
  .bg-opt .bg-name { display:flex; align-items:center; justify-content:space-between; gap:6px; padding: 0 4px; }
  .bg-opt .bg-name small { color: var(--gm-dim); font-size: 11px; }
  .bg-opt svg { font-size:18px; }
  .bg-prev { position:relative; height:72px; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,.12);
    background: radial-gradient(circle at 22% 30%, var(--p1) 0, transparent 58%), radial-gradient(circle at 82% 40%, var(--p2) 0, transparent 58%),
      radial-gradient(circle at 50% 100%, var(--p3) 0, transparent 62%), var(--pb); }
  .bg-prev i { position:absolute; left:12px; right:30px; top:18px; height:12px; border-radius:6px; background: rgba(255,255,255,.28); }
  .bg-prev i + i { top:38px; right:52px; background: rgba(255,255,255,.18); }
  .custom-row { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; }
  .color-field { display:flex; flex-direction:column; gap:6px; font-size:13px; color: var(--gm-dim); }
  .color-field input { width:64px; height:48px; padding:3px; border-radius:14px; border:1px solid rgba(255,255,255,.25); background: rgba(0,0,0,.2); cursor:pointer; }
  .color-field input::-webkit-color-swatch-wrapper { padding:0; }
  .color-field input::-webkit-color-swatch { border:none; border-radius:10px; }
  .color-field input::-moz-color-swatch { border:none; border-radius:10px; }

  @media (max-width: 600px) { .title { display:none; } header { padding: 12px 14px; } .row > label { width:100%; } .new span, .people-btn span { display:none; }
    .sheet { padding: 18px 18px 20px; } .editor-scrim .sheet-foot { margin: 12px -18px -20px; padding: 12px 18px 16px; bottom: -20px; }
    .avatar.xl { width:48px; height:48px; font-size:24px; } .pform-top { gap:10px; } .card-inset { padding: 14px; } }

  /* task tiles */
  .board { display:grid; grid-template-columns: repeat(auto-fill, minmax(var(--gm-col, 260px), 1fr)); gap: 18px; align-content:start; }
  .board > .empty, .board > .problem { grid-column: 1 / -1; }
  .task { display:flex; flex-direction:column; animation: rise .6s cubic-bezier(.2,.8,.2,1) both; transition: transform .25s ease, box-shadow .4s ease, opacity .4s ease; }
  @keyframes rise { from { opacity:0; transform: translateY(18px) scale(.97); } to { opacity:1; transform:none; } }
  .t-main { display:flex; align-items:center; gap:14px; padding: 18px 18px 10px 18px; text-align:left; width:100%; border-radius: var(--gm-radius) var(--gm-radius) 0 0; }
  .t-main:active { transform: scale(.98); }
  .t-icon { font-size: 38px; width:58px; height:58px; display:grid; place-items:center; border-radius: 18px; background: rgba(255,255,255,.12); flex:none; }
  .t-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
  .t-title { font-size: 20px; font-weight:600; line-height:1.2; letter-spacing:-.01em; }
  .t-status { font-size: 14px; color: var(--gm-dim); }
  .t-status b { color: var(--gm-text); font-weight:600; }
  .t-check { width:46px; height:46px; border-radius:50%; flex:none; display:grid; place-items:center; font-size:26px;
    border: 2px solid rgba(255,255,255,.55); transition: background .3s, border-color .3s, transform .3s; }
  .t-foot { display:flex; align-items:center; gap:8px; padding: 6px 10px 12px 18px; font-size:13px; color: var(--gm-dim); min-height: 44px; }
  .t-foot .avatar { width:24px; height:24px; font-size:11px; }
  .t-foot .everyone-sm { font-size:16px; }
  .t-who { flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .t-dots { display:flex; gap:4px; }
  .t-dots i { width:8px; height:8px; border-radius:50%; border:1.5px solid rgba(255,255,255,.6); }
  .t-dots i.on { background: rgb(${DONE_TINT}); border-color: rgb(${DONE_TINT}); }
  .t-more { width:36px; height:36px; border-radius:50%; display:grid; place-items:center; font-size:20px; background: rgba(255,255,255,.08); }
  .task.st-done { --tint: ${DONE_TINT}; }
  .task.st-done .t-check { background: rgb(${DONE_TINT}); border-color: transparent; color:#06311f; }
  .task.st-done .t-title { opacity:.85; }
  .task.st-overdue { --tint: ${OVERDUE_TINT}; box-shadow: 0 0 0 1.5px rgba(${OVERDUE_TINT}, .75), 0 0 46px -8px rgba(${OVERDUE_TINT}, .85), 0 18px 50px -18px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.38); animation: rise .6s cubic-bezier(.2,.8,.2,1) both, glow 2.6s ease-in-out infinite; }
  .task.st-overdue .t-status { color: #ffd0da; }
  .task.st-overdue .t-check { border-color: rgba(${OVERDUE_TINT}, .95); }
  @keyframes glow { 50% { box-shadow: 0 0 0 1.5px rgba(${OVERDUE_TINT}, .45), 0 0 26px -10px rgba(${OVERDUE_TINT}, .5), 0 18px 50px -18px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.38); } }
  .task.st-upcoming { opacity:.62; }
  .task.st-upcoming .t-check { border-style: dashed; border-color: rgba(255,255,255,.35); }
  .task.just-done .t-check { animation: tick .7s cubic-bezier(.2,.9,.25,1.4); }
  @keyframes tick { 0% { transform: scale(.4); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
  .task.just-done::after { content:""; position:absolute; inset:-2px; border-radius: inherit; pointer-events:none; animation: flash .9s ease-out both;
    box-shadow: 0 0 0 2px rgba(${DONE_TINT}, .9), 0 0 60px rgba(${DONE_TINT}, .8); }
  @keyframes flash { to { opacity:0; transform: scale(1.04); } }
  .sec-title { grid-column: 1 / -1; margin: 6px 4px -6px; font-size: 13px; letter-spacing:.08em; text-transform:uppercase; color: var(--gm-dim); font-weight:600; }
  .chip.alert .n { background: rgba(${OVERDUE_TINT}, .85); }

  /* who did it / detail / editor */
  .pick-title { display:flex; align-items:center; gap:14px; margin: 0 0 18px; }
  .pick-title .t-icon { width:64px; height:64px; font-size:40px; }
  .pick-title h2 { margin:0; font-size: 26px; font-weight:600; }
  .pick-title p { margin: 4px 0 0; color: var(--gm-dim); }
  .tiles.big { grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap:14px; }
  .tiles.big .tile { padding: 18px 8px 14px; font-size:16px; }
  .tiles.big .tile .avatar, .tiles.big .everyone-av { width:72px; height:72px; font-size:34px; }
  .history { margin: 18px 0 0; padding:0; list-style:none; }
  .history li { display:flex; align-items:center; gap:12px; padding: 10px 4px; border-top: 1px solid rgba(255,255,255,.1); font-size:15px; }
  .history li span:nth-child(2) { flex:1; }
  .history small { color: var(--gm-dim); }
  .facts { display:flex; flex-wrap:wrap; gap:8px; margin-top: 4px; }
  .fact { display:inline-flex; align-items:center; gap:6px; padding: 6px 12px; border-radius:999px; font-size:14px; background: rgba(255,255,255,.1); }
  .fact svg { font-size:16px; }
  .presets { display:flex; flex-wrap:wrap; gap:8px; margin-top: 10px; }
  .days { display:flex; flex-wrap:wrap; gap:8px; }
  .days .chip { min-width: 58px; justify-content:center; }
  .stepper { display:inline-flex; align-items:center; gap:14px; font-size:18px; }
  .stepper b { min-width: 7ch; text-align:center; font-weight:500; }
  .time-list { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .time-chip { display:inline-flex; align-items:center; gap:6px; padding: 8px 8px 8px 16px; border-radius:999px; font-size:16px; background: rgba(255,255,255,.22); border:1px solid rgba(255,255,255,.4); }
  .time-chip button { width:28px; height:28px; border-radius:50%; display:grid; place-items:center; font-size:16px; background: rgba(0,0,0,.2); }
  input[type=time].field { max-width: 170px; color-scheme: dark; }
  .toggle-row { display:flex; align-items:center; gap:14px; margin-top: 16px; }
  .toggle-row span { flex:1; }
  .a-spot .t-title { font-size: clamp(24px, 2.8vw, 34px); }
  .a-spot .spot-row { display:flex; align-items:center; gap:18px; }
  .a-spot .t-icon { width:76px; height:76px; font-size:46px; }
  .a-spot .t-status { font-size: 17px; margin-top:4px; }
  @media (max-width: 600px) { .filters { order:5; flex: 1 1 100%; flex-wrap:nowrap; overflow-x:auto; justify-content:flex-start; scrollbar-width:none; } .filters::-webkit-scrollbar { display:none; } .chip { flex:none; } .t-icon { width:48px; height:48px; font-size:30px; } .t-title { font-size:18px; } .board { gap:14px; } }
  @media (prefers-reduced-motion: reduce) { .task, .task.st-overdue, .task.just-done .t-check, .task.just-done::after, .od-wrap, .od-wrap::after, .od-alert .bell { animation: none !important; } }
  `;

  const DAY_INDEX = [0, 1, 2, 3, 4, 5, 6]; // 0 = Monday, like Python

  class GlassTaskBoard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._tasks = new Map();
      this._filter = "all";
      this._built = false;
      this._ambient = false;
      this._spotIndex = 0;
      this._members = [];
      this._settings = { include_ha_people: true, background: { preset: DEFAULT_BACKGROUND, colors: [] } };
      this._peopleUi = null;
      this._lookUi = null;
      this._editor = null;
      this._pickId = null;
      this._openId = null;
      this._justDone = new Set();
    }

    static getStubConfig(hass) {
      return { title: tr(langOf(hass || (document.querySelector("home-assistant") || {}).hass), "stub_title") };
    }

    static getConfigForm() {
      return {
        schema: [
          { name: "title", selector: { text: {} } },
          { name: "height", selector: { text: {} } },
          { name: "ambient_after", selector: { number: { min: 0, max: 900, step: 5, unit_of_measurement: "s", mode: "box" } } },
          { name: "column_width", selector: { number: { min: 180, max: 600, step: 10, unit_of_measurement: "px", mode: "box" } } },
          { name: "background_image", selector: { text: {} } },
          { name: "show_clock", selector: { boolean: {} } },
          { name: "group_by_status", selector: { boolean: {} } },
          { name: "alert_overdue", selector: { boolean: {} } },
          { name: "alert_sound", selector: { boolean: {} } },
          { name: "alert_snooze", selector: { number: { min: 1, max: 240, step: 1, unit_of_measurement: "min", mode: "box" } } },
        ],
        computeLabel: (s) => {
          const key = { title: "cf_title", height: "cf_height", ambient_after: "cf_ambient", column_width: "cf_column", background_image: "cf_bgimg", show_clock: "cf_clock", group_by_status: "cf_group", alert_overdue: "cf_alert", alert_sound: "cf_sound", alert_snooze: "cf_snooze" }[s.name];
          return key ? tr(pageLang(), key) : undefined;
        },
      };
    }

    setConfig(config) {
      this._titleDefault = !config || config.title === undefined;
      this._config = {
        height: "calc(100vh - var(--header-height, 56px) - 16px)",
        ambient_after: 120,
        column_width: 260,
        show_clock: true,
        group_by_status: false,
        background_image: "",
        alert_overdue: true,
        alert_sound: false,
        alert_snooze: 15,
        ...config,
      };
      if (this._built) {
        this._applyConfig();
        this._renderBoard();
      }
    }

    _t(key, vars) {
      return tr(langOf(this._hass), key, vars);
    }

    set hass(hass) {
      const first = !this._hass;
      this._hass = hass;
      if (!this._built) this._build();
      const lang = langOf(hass);
      if (this._langCode !== lang) {
        const changed = this._langCode !== undefined;
        this._langCode = lang;
        if (changed) this._relabel();
      }
      const sig = this._people()
        .map((p) => p.id + p.name + p.pic)
        .join("|");
      if (sig !== this._peopleSig) {
        this._peopleSig = sig;
        this._renderFilters();
        this._renderBoard();
      }
      if (first && this.isConnected) this._subscribe();
    }

    connectedCallback() {
      if (this._hass && !this._unsub) this._subscribe();
      this._tick();
      this._clockTimer = setInterval(() => this._tick(), 15000);
      this._relTimer = setInterval(() => this._renderBoard(), 60000);
      this._alertTimer = setInterval(() => this._checkAlerts(), 30000);
      this._resetIdle();
    }

    disconnectedCallback() {
      clearInterval(this._clockTimer);
      clearInterval(this._relTimer);
      clearInterval(this._alertTimer);
      clearInterval(this._spotTimer);
      clearTimeout(this._idleTimer);
      if (this._unsub) {
        Promise.resolve(this._unsub).then((u) => typeof u === "function" && u()).catch(() => {});
        this._unsub = null;
      }
    }

    getCardSize() {
      return 12;
    }

    getGridOptions() {
      return { columns: "full", rows: 10, min_rows: 6 };
    }

    // ---------------------------------------------------------------- data
    async _subscribe() {
      if (this._unsub || this._subscribing || !this._hass) return;
      this._subscribing = true;
      try {
        this._unsub = await this._hass.connection.subscribeMessage((ev) => this._onEvent(ev), {
          type: "glass_tasks/subscribe",
        });
        this._problem = null;
      } catch (err) {
        this._problem = err && (err.code === "unknown_command" || err.code === "not_loaded") ? "setup" : (err && err.message) || String(err);
        this._renderBoard();
      }
      this._subscribing = false;
    }

    _onEvent(ev) {
      if (ev.action === "snapshot") {
        this._tasks = new Map(ev.tasks.map((t) => [t.id, t]));
        this._members = ev.members || [];
        this._settings = ev.settings || { include_ha_people: true };
        this._loaded = true;
      } else if (ev.action === "people") {
        this._members = ev.task.members || [];
        this._settings = ev.task.settings || this._settings;
      } else if (ev.action === "removed") {
        this._tasks.delete(ev.task.id);
        if (this._openId === ev.task.id) this._closeDetail();
        if (this._pickId === ev.task.id) this._closePick();
        if (this._editor && this._editor.id === ev.task.id) this._closeEditor();
      } else if (ev.task) {
        const before = this._tasks.get(ev.task.id);
        this._tasks.set(ev.task.id, ev.task);
        if (before && before.status !== "done" && ev.task.status === "done") this._flash(ev.task.id);
        if (this._openId === ev.task.id) this._renderDetail();
      }
      this._renderFilters();
      this._renderBoard();
      if (this._ambient) this._renderSpot(true);
      if (ev.action === "snapshot" || ev.action === "people") {
        this._applyBackground();
        if (this._lookUi) this._renderLook();
        if (this._editor) this._renderEditor();
        if (this._pickId) this._renderPick();
        if (this._peopleUi) this._renderPeople();
      }
      this._checkAlerts();
    }

    _flash(id) {
      this._justDone.add(id);
      setTimeout(() => {
        this._justDone.delete(id);
        const el = this.shadowRoot.querySelector(`.task[data-id="${CSS.escape(id)}"]`);
        if (el) el.classList.remove("just-done");
      }, 1200);
    }

    _sorted() {
      return [...this._tasks.values()].sort((a, b) => (a.order || 0) - (b.order || 0) || (a.created < b.created ? -1 : 1));
    }

    _haPeople() {
      const states = (this._hass && this._hass.states) || {};
      return Object.keys(states)
        .filter((id) => id.startsWith("person."))
        .map((id) => ({
          id,
          name: states[id].attributes.friendly_name || id.slice(7),
          pic: states[id].attributes.entity_picture || "",
          user: states[id].attributes.user_id,
          ha: true,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    _people() {
      const members = (this._members || []).map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, hue: m.hue, notify: m.notify || [], member: true }));
      const ha = this._settings && this._settings.include_ha_people === false ? [] : this._haPeople();
      return [...members, ...ha].sort((a, b) => a.name.localeCompare(b.name));
    }

    _notifyServices() {
      const svcs = Object.keys((this._hass && this._hass.services && this._hass.services.notify) || {}).filter(
        (s) => !["send_message", "persistent_notification"].includes(s)
      );
      const pretty = (s) => {
        const mobile = s.startsWith("mobile_app_");
        const base = (mobile ? s.slice(11) : s).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return mobile ? this._t("phone_app", { name: base }) : base;
      };
      return svcs
        .sort((a, b) => (b.startsWith("mobile_app_") - a.startsWith("mobile_app_")) || a.localeCompare(b))
        .map((s) => ({ value: `notify.${s}`, label: pretty(s) }));
    }

    _me() {
      const uid = this._hass && this._hass.user && this._hass.user.id;
      return this._people().find((p) => p.user && p.user === uid) || null;
    }

    _myReactKey() {
      const me = this._me();
      return me ? me.id : `user:${this._hass && this._hass.user ? this._hass.user.id : ""}`;
    }

    _person(id, fallbackName) {
      const p = id && [...this._people(), ...this._haPeople()].find((x) => x.id === id);
      if (p) return p;
      return { id: id || "home", name: fallbackName || this._t("home"), pic: "", home: !id };
    }

    _visible() {
      const f = this._filter;
      const all = this._sorted();
      if (f === "all") return all;
      if (f === "todo") return all.filter((t) => t.status === "due" || t.status === "overdue");
      return all.filter((t) => t.assignee === f || t.assignee === "everyone");
    }

    _anySheet() {
      return !!(this._editor || this._pickId || this._openId || this._peopleUi || this._lookUi || this._alertOpen);
    }

    // ------------------------------------------------------------- render
    _build() {
      this._built = true;
      this.shadowRoot.innerHTML = `
        <style>${STYLE}</style>
        <div class="root">
          <div class="aurora"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>
          <div class="bgimg"></div>
          <div class="grain"></div>
          <div class="ui">
            <header class="glass">
              <div class="clock"><div class="time"></div><div class="date"></div></div>
              <div class="title"></div>
              <nav class="filters"></nav>
              <button class="ghost-btn icon-only" data-action="look" aria-label="${this._t("bg_colours")}" title="${this._t("bg_colours")}">${ICON.palette}</button>
              <button class="ghost-btn people-btn" data-action="people" aria-label="${this._t("people")}">${ICON.people}<span>${this._t("people")}</span></button>
              <button class="new" data-action="new-task">${ICON.plus}<span>${this._t("new_task")}</span></button>
            </header>
            <main><div class="board"></div></main>
          </div>
          <div class="ambient" data-action="wake">
            <div class="a-time"></div><div class="a-date"></div>
            <div class="a-spot glass"></div>
            <div class="a-hint">${this._t("wake")}</div>
          </div>
          <div class="scrim pick-scrim" hidden></div>
          <div class="scrim detail-scrim" hidden></div>
          <div class="scrim editor-scrim" hidden></div>
          <div class="scrim people-scrim" hidden></div>
          <div class="scrim look-scrim" hidden></div>
          <div class="scrim alert-scrim" hidden></div>
        </div>`;
      const root = this.shadowRoot.querySelector(".root");
      root.addEventListener("click", (e) => this._onClick(e));
      root.addEventListener("pointerdown", () => this._resetIdle(), { passive: true });
      root.addEventListener("keydown", () => this._resetIdle(), { passive: true });
      this._applyConfig();
    }

    // The language changed while the board was open: update the fixed labels.
    _relabel() {
      const q = (sel) => this.shadowRoot.querySelector(sel);
      const look = q('header [data-action="look"]');
      look.setAttribute("aria-label", this._t("bg_colours"));
      look.setAttribute("title", this._t("bg_colours"));
      q('header [data-action="people"]').setAttribute("aria-label", this._t("people"));
      q('header [data-action="people"] span').textContent = this._t("people");
      q('header [data-action="new-task"] span').textContent = this._t("new_task");
      q(".a-hint").textContent = this._t("wake");
      this._applyConfig();
      this._renderFilters();
      this._renderBoard();
      if (this._ambient) this._renderSpot(true);
      if (this._lookUi) this._renderLook();
      if (this._editor) this._renderEditor();
      if (this._pickId) this._renderPick();
      if (this._openId) this._renderDetail();
      if (this._peopleUi) this._renderPeople();
      if (this._alertOpen) this._renderAlert(true);
    }

    _applyConfig() {
      const c = this._config || {};
      const root = this.shadowRoot.querySelector(".root");
      root.style.setProperty("--gm-height", c.height);
      root.style.setProperty("--gm-col", `${Number(c.column_width) || 260}px`);
      const title = this._titleDefault ? this._t("default_title") : c.title;
      this.shadowRoot.querySelector(".title").textContent = title || "";
      this.shadowRoot.querySelector(".title").style.display = title ? "" : "none";
      this.shadowRoot.querySelector(".clock").style.display = c.show_clock === false ? "none" : "";
      const bg = this.shadowRoot.querySelector(".bgimg");
      bg.style.backgroundImage = c.background_image ? `url("${String(c.background_image).replace(/["\\]/g, "")}")` : "";
      this._tick();
      this._resetIdle();
    }

    _avatar(p, cls = "") {
      const hue = p.hue ?? AVATAR_HUES[hash(p.id) % AVATAR_HUES.length];
      const inner = p.home ? "🏠" : p.emoji ? esc(p.emoji) : p.pic ? `<img src="${esc(p.pic)}" alt="">` : esc(initials(p.name));
      return `<span class="avatar ${cls} ${p.home ? "home" : ""}" style="--h:${hue}">${inner}</span>`;
    }

    _renderFilters() {
      if (!this._built) return;
      const nav = this.shadowRoot.querySelector(".filters");
      const all = this._sorted();
      const todo = all.filter((t) => t.status === "due" || t.status === "overdue").length;
      const late = all.some((t) => t.status === "overdue");
      let html = `<button class="chip text ${this._filter === "all" ? "on" : ""}" data-action="filter" data-f="all">${this._t("all")} <span class="n">${all.length}</span></button>`;
      html += `<button class="chip text ${this._filter === "todo" ? "on" : ""} ${late ? "alert" : ""}" data-action="filter" data-f="todo">${this._t("todo")} <span class="n">${todo}</span></button>`;
      for (const p of this._people()) {
        html += `<button class="chip ${this._filter === p.id ? "on" : ""}" data-action="filter" data-f="${esc(p.id)}" title="${esc(p.name)}">${this._avatar(p)}<span>${esc(p.name.split(" ")[0])}</span></button>`;
      }
      nav.innerHTML = html;
    }

    // ------------------------------------------------------------- time text
    _lang() {
      return (this._hass && this._hass.locale && this._hass.locale.language) || navigator.language;
    }

    _dayDiff(iso) {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return NaN;
      const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
      return Math.round((startOf(d) - startOf(new Date())) / 86400e3);
    }

    _clock(iso) {
      const d = typeof iso === "string" ? new Date(iso) : iso;
      if (!d || Number.isNaN(d.getTime())) return "";
      return d.toLocaleTimeString(this._lang(), { hour: "numeric", minute: "2-digit" });
    }

    _hhmm(t) {
      const [h, m] = String(t).split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return this._clock(d);
    }

    _day(iso) {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      const diff = this._dayDiff(iso);
      if (diff === 0) return this._t("day_today");
      if (diff === 1) return this._t("day_tomorrow");
      if (diff === -1) return this._t("day_yesterday");
      if (diff > 1 && diff < 7) return d.toLocaleDateString(this._lang(), { weekday: "long" });
      return d.toLocaleDateString(this._lang(), { month: "short", day: "numeric" });
    }

    _when(iso, withDay = true) {
      return withDay && this._dayDiff(iso) !== 0 ? `${this._day(iso)} ${this._clock(iso)}` : this._clock(iso);
    }

    // When a task next comes back. Tasks without a due time only need the day.
    _nextWhen(t) {
      return (t.times || []).length ? this._when(t.next_due) : this._day(t.next_due);
    }

    _dayName(i, style = "short") {
      // 2 November 2026 is a Monday, so day 0 = Monday like the integration.
      return new Date(2026, 10, 2 + i).toLocaleDateString(this._lang(), { weekday: style });
    }

    _scheduleText(t) {
      const times = (t.times || []).slice().sort();
      const at = (label) => (times.length ? this._t("sch_by", { label, times: times.map((x) => this._hhmm(x)).join(" & ") }) : label);
      if (t.repeat === "weekly") {
        const days = (t.days || []).slice().sort();
        let label;
        if (days.length === 7) label = this._t("every_day");
        else if (days.join() === "0,1,2,3,4") label = this._t("weekdays");
        else if (days.join() === "5,6") label = this._t("weekends");
        else label = this._t("every_list", { days: days.map((d) => this._dayName(d)).join(", ") });
        return at(label);
      }
      if (t.repeat === "every") {
        const n = Number(t.every_days) || 1;
        return at(n > 1 ? this._t("every_n", { n }) : this._t("every_day"));
      }
      if (t.repeat === "once") {
        const d = t.date ? new Date(`${t.date}T00:00`) : null;
        const date = d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(this._lang(), { weekday: "short", month: "short", day: "numeric" }) : "";
        return at(this._t("once_on", { date }));
      }
      if (times.length === 2) return at(this._t("twice"));
      if (times.length > 2) return at(this._t("n_times", { n: times.length }));
      return at(this._t("every_day"));
    }

    _statusText(t) {
      switch (t.status) {
        case "done": {
          const who = t.done_by_name ? `<b>${esc(t.done_by_name)}</b> · ` : "";
          return `${esc(this._t("st_done"))} · ${who}${esc(this._when(t.done_at))}`;
        }
        case "overdue":
          return esc(this._t("st_overdue", { when: t.due_at ? this._when(t.due_at) : this._day(t.period_start) }));
        case "due":
          if (t.due_at) return this._t("st_due_by", { time: `<b>${esc(this._clock(t.due_at))}</b>` });
          return esc(t.repeat === "every" ? this._t("st_due_today") : this._t("st_any_time"));
        default:
          if (t.repeat === "once" && t.next_due) {
            const when = this._nextWhen(t);
            // "Tomorrow 7:00 AM" rather than "On tomorrow 7:00 AM".
            return esc(this._dayDiff(t.next_due) <= 1 ? when.charAt(0).toUpperCase() + when.slice(1) : this._t("st_on", { when }));
          }
          return esc(t.next_due ? this._t("st_next", { when: this._nextWhen(t) }) : this._t("st_not_today"));
      }
    }

    _nextLine(t) {
      // For a done task that comes back later today, say when.
      if (t.status !== "done" || !t.next_due) return "";
      return this._dayDiff(t.next_due) === 0 && (t.times || []).length ? ` · ${esc(this._t("next_by", { time: this._clock(t.next_due) }))}` : "";
    }

    // ------------------------------------------------------------- tiles
    _assigneeHTML(t) {
      if (!t.assignee || t.assignee === "everyone") return `<span class="everyone-sm">🏡</span><span class="t-who">${esc(this._t("everyone"))}</span>`;
      const p = this._person(t.assignee, this._t("someone"));
      return `${this._avatar(p)}<span class="t-who">${esc(this._t("job", { name: p.name }))}</span>`;
    }

    _taskHTML(t, opts = {}) {
      const tint = TINTS[t.tint] || TINTS.clear;
      const slots = Number(t.slots_today) || 0;
      const dots = slots > 1 && t.status !== "upcoming"
        ? `<span class="t-dots" aria-label="${esc(this._t("dots", { n: t.done_today, m: slots }))}">${Array.from({ length: slots }, (_, i) => `<i class="${i < t.done_today ? "on" : ""}"></i>`).join("")}</span>`
        : "";
      return `
        <div class="task glass st-${esc(t.status)} ${this._justDone.has(t.id) ? "just-done" : ""}" data-id="${esc(t.id)}" style="--tint:${tint}; ${opts.delay ? `animation-delay:${opts.delay}ms` : ""}">
          <button class="t-main" data-action="t-tap" data-id="${esc(t.id)}" aria-label="${esc(t.title)}: ${esc(this._t(`stat_${t.status}`))}">
            <span class="t-icon">${esc(t.icon || "✅")}</span>
            <span class="t-body"><span class="t-title">${esc(t.title)}</span><span class="t-status">${this._statusText(t)}${this._nextLine(t)}</span></span>
            <span class="t-check">${t.status === "done" ? ICON.check : ""}</span>
          </button>
          <div class="t-foot">${this._assigneeHTML(t)}${dots}
            <button class="t-more" data-action="t-open" data-id="${esc(t.id)}" aria-label="${esc(this._t("details_for", { title: t.title }))}">${ICON.dots}</button>
          </div>
        </div>`;
    }

    _renderBoard() {
      if (!this._built) return;
      const board = this.shadowRoot.querySelector(".board");
      if (this._problem === "setup") {
        board.innerHTML = `<div class="problem glass"><div class="big">🧩</div><h2>${this._t("almost")}</h2>
          <p>${this._t("setup_html")}</p></div>`;
        return;
      }
      if (this._problem) {
        board.innerHTML = `<div class="problem glass"><h2>${this._t("cant_load")}</h2><p>${esc(this._problem)}</p></div>`;
        return;
      }
      if (!this._loaded) {
        board.innerHTML = "";
        return;
      }
      const list = this._visible();
      if (!list.length) {
        const fresh = !this._tasks.size;
        const noPeople = !this._people().length;
        const allDone = this._filter === "todo" && this._tasks.size;
        board.innerHTML = `<div class="empty glass"><div class="big">${fresh ? "👋" : allDone ? "🎉" : "✨"}</div>
          <h2>${esc(this._t(fresh ? "welcome" : allDone ? "all_done" : "nothing_here"))}</h2>
          <p>${esc(this._t(fresh ? "fresh_lead" : allDone ? "all_done_lead" : "no_match"))}</p>
          ${fresh ? `<div class="cta">${noPeople ? `<button class="ghost-btn" data-action="people">${ICON.people}<span>${this._t("add_people")}</span></button>` : ""}
            <button class="new" data-action="new-task">${ICON.plus}<span>${this._t("add_first")}</span></button></div>` : ""}</div>`;
        return;
      }
      const animate = !this._renderedOnce;
      let i = 0;
      const tile = (t) => this._taskHTML(t, { delay: animate ? i++ * 50 : 0 });
      if (this._config && this._config.group_by_status) {
        const groups = [
          [this._t("todo"), list.filter((t) => t.status === "overdue" || t.status === "due")],
          [this._t("done"), list.filter((t) => t.status === "done")],
          [this._t("coming_up"), list.filter((t) => t.status === "upcoming")],
        ].filter(([, items]) => items.length);
        board.innerHTML = groups.map(([name, items]) => `<div class="sec-title">${esc(name)}</div>${items.map(tile).join("")}`).join("");
      } else {
        board.innerHTML = list.map(tile).join("");
      }
      if (!animate) board.querySelectorAll(".task").forEach((n) => (n.style.animation = n.classList.contains("st-overdue") ? "glow 2.6s ease-in-out infinite" : "none"));
      this._renderedOnce = true;
    }

    _tick() {
      if (!this._built) return;
      const now = new Date();
      const lang = (this._hass && this._hass.locale && this._hass.locale.language) || navigator.language;
      const time = now.toLocaleTimeString(lang, { hour: "numeric", minute: "2-digit" });
      const date = now.toLocaleDateString(lang, { weekday: "long", month: "long", day: "numeric" });
      this.shadowRoot.querySelector(".time").textContent = time;
      this.shadowRoot.querySelector(".date").textContent = date;
      this.shadowRoot.querySelector(".a-time").textContent = time;
      this.shadowRoot.querySelector(".a-date").textContent = date;
    }

    // ------------------------------------------------------------- events
    _onClick(e) {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const a = el.dataset.action;
      const id = el.dataset.id;
      switch (a) {
        case "wake":
          this._setAmbient(false);
          break;
        case "filter":
          this._filter = el.dataset.f;
          this._renderedOnce = false;
          this._renderFilters();
          this._renderBoard();
          break;
        case "new-task":
          this._openEditor(null);
          break;
        case "people":
          this._openPeople();
          break;
        case "look":
          this._openLook();
          break;
        case "t-tap": {
          const t = this._tasks.get(id);
          if (t && (t.status === "due" || t.status === "overdue")) this._openPick(id);
          else this._openDetail(id);
          break;
        }
        case "t-open":
          this._openDetail(id);
          break;
        default:
          if (a.startsWith("p-")) this._onPeopleClick(el, a);
          else if (a.startsWith("l-")) this._onLookClick(el, a);
          else if (a.startsWith("k-")) this._onPickClick(el, a);
          else if (a.startsWith("d-")) this._onDetailClick(el, a);
          else if (a.startsWith("e-")) this._onEditorClick(el, a);
          else if (a.startsWith("x-")) this._onAlertClick(el, a);
      }
    }

    async _call(msg) {
      try {
        await this._hass.callWS(msg);
        return true;
      } catch (err) {
        this._toastError((err && err.message) || String(err));
        return false;
      }
    }

    _toastError(text) {
      const target = this.shadowRoot.querySelector(".scrim:not([hidden]) .err");
      if (target) target.textContent = text;
      else console.warn("[glass-task-board]", text);
    }

    _openScrim(cls, close) {
      const scrim = this.shadowRoot.querySelector(`.${cls}`);
      scrim.hidden = false;
      scrim.onclick = (e) => {
        if (e.target === scrim) close();
      };
      return scrim;
    }

    _hideScrim(cls) {
      const s = this.shadowRoot.querySelector(`.${cls}`);
      s.hidden = true;
      s.innerHTML = "";
      s.oninput = s.onchange = s.onkeydown = null;
      this._resetIdle();
    }

    _taskHead(t, sub) {
      return `<div class="pick-title"><span class="t-icon">${esc(t.icon || "✅")}</span><div><h2>${esc(t.title)}</h2>${sub ? `<p>${sub}</p>` : ""}</div></div>`;
    }

    // --------------------------------------------------------- who did it?
    _openPick(id) {
      const people = this._people();
      if (!people.length) {
        // Nobody set up yet: just mark it done.
        this._complete(id, null);
        return;
      }
      this._pickId = id;
      this._openScrim("pick-scrim", () => this._closePick());
      this._renderPick();
    }

    _closePick() {
      this._pickId = null;
      this._hideScrim("pick-scrim");
      this._checkAlerts();
    }

    _suggestedDoer(t) {
      const me = this._me();
      if (me) return me.id;
      if (t.assignee && t.assignee !== "everyone") return t.assignee;
      const last = storage.get(LAST_DOER_KEY);
      return last && this._people().some((p) => p.id === last) ? last : null;
    }

    _renderPick() {
      const t = this._tasks.get(this._pickId);
      const scrim = this.shadowRoot.querySelector(".pick-scrim");
      if (!t) return this._closePick();
      const hint = this._suggestedDoer(t);
      const people = this._people().slice().sort((a, b) => (b.id === hint) - (a.id === hint));
      const settled = scrim.querySelector(".sheet") ? " settled" : "";
      scrim.innerHTML = `
        <div class="sheet glass${settled}" style="--tint:${TINTS[t.tint] || TINTS.clear}">
          <div class="sheet-head"><h2>${this._t("who_did")}</h2><button class="icon-btn" data-action="k-close" aria-label="${this._t("close")}">${ICON.close}</button></div>
          ${this._taskHead(t, this._statusText(t))}
          <div class="tiles big">
            ${people.map((p) => `<button class="tile ${p.id === hint ? "on" : ""}" data-action="k-who" data-id="${esc(p.id)}">${this._avatar(p)}<span>${esc(p.name)}</span></button>`).join("")}
            <button class="tile" data-action="k-who" data-id=""><span class="everyone-av">🙂</span><span>${esc(this._t("someone"))}</span></button>
          </div>
          <div class="sheet-foot"><span class="err"></span><button class="ghost-btn" data-action="k-details">${ICON.clock}<span>${esc(this._t("history_settings"))}</span></button></div>
        </div>`;
    }

    async _complete(id, by) {
      const payload = { type: "glass_tasks/task/complete", task_id: id };
      if (by) {
        payload.by = by;
        storage.set(LAST_DOER_KEY, by);
      }
      return this._call(payload);
    }

    async _onPickClick(el, a) {
      switch (a) {
        case "k-close":
          return this._closePick();
        case "k-details": {
          const id = this._pickId;
          this._closePick();
          return this._openDetail(id);
        }
        case "k-who": {
          if (el.disabled) return;
          el.disabled = true;
          const ok = await this._complete(this._pickId, el.dataset.id || null);
          if (ok) this._closePick();
          else el.disabled = false;
        }
      }
    }

    // --------------------------------------------------------------- detail
    _openDetail(id) {
      this._openId = id;
      this._openScrim("detail-scrim", () => this._closeDetail());
      this._renderDetail();
    }

    _closeDetail() {
      this._openId = null;
      this._hideScrim("detail-scrim");
    }

    _renderDetail() {
      const t = this._tasks.get(this._openId);
      const scrim = this.shadowRoot.querySelector(".detail-scrim");
      if (!t) return this._closeDetail();
      const assignee = !t.assignee || t.assignee === "everyone" ? this._t("everyones_job") : this._t("job", { name: this._person(t.assignee, this._t("someone")).name });
      const history = (t.history || [])
        .map((h) => {
          const p = h.by ? this._person(h.by, h.by_name || this._t("someone")) : { id: "someone", name: this._t("someone"), emoji: "🙂", hue: 210 };
          return `<li>${this._avatar(p)}<span>${esc(p.name)}</span><small>${esc(this._when(h.at))}</small></li>`;
        })
        .join("");
      const todo = t.status === "due" || t.status === "overdue";
      const settled = scrim.querySelector(".detail") ? " settled" : "";
      scrim.innerHTML = `
        <div class="detail glass${settled}" style="--tint:${t.status === "overdue" ? OVERDUE_TINT : t.status === "done" ? DONE_TINT : TINTS[t.tint] || TINTS.clear}">
          ${this._taskHead(t, this._statusText(t) + this._nextLine(t))}
          <div class="facts">
            <span class="fact">${ICON.clock}${esc(this._scheduleText(t))}</span>
            <span class="fact">${esc(assignee)}</span>
            ${t.notify === false ? `<span class="fact">${this._t("no_reminders")}</span>` : ""}
          </div>
          ${history ? `<ul class="history">${history}</ul>` : `<p class="muted" style="margin-top:18px">${this._t("not_done_yet")}</p>`}
          <div class="actions">
            <button data-action="d-done">${ICON.check}<span>${this._t(todo ? "mark_done" : "mark_again")}</span></button>
            ${(t.history || []).length ? `<button data-action="d-undo">${ICON.undo}<span>${this._t("undo_last")}</span></button>` : ""}
            <button data-action="d-edit">${ICON.edit}<span>${this._t("edit")}</span></button>
            <span style="flex:1"></span>
            <button data-action="d-close">${ICON.close}<span>${this._t("close")}</span></button>
          </div>
          <div class="err" style="margin-top:10px"></div>
        </div>`;
    }

    _onDetailClick(el, a) {
      const id = this._openId;
      switch (a) {
        case "d-close":
          return this._closeDetail();
        case "d-done":
          this._closeDetail();
          return this._openPick(id);
        case "d-undo":
          return this._call({ type: "glass_tasks/task/undo", task_id: id });
        case "d-edit":
          this._closeDetail();
          return this._openEditor(id);
      }
    }

    // --------------------------------------------------------------- editor
    _openEditor(id) {
      const t = id ? this._tasks.get(id) : null;
      this._editor = {
        id: t ? t.id : null,
        title: t ? t.title : "",
        icon: t ? t.icon || "✅" : "✅",
        tint: t ? t.tint || "clear" : "clear",
        assignee: t ? t.assignee || "everyone" : "everyone",
        repeat: t ? t.repeat || "daily" : "daily",
        days: t ? [...(t.days || [])] : [],
        every_days: t ? Number(t.every_days) || 1 : 3,
        times: t ? [...(t.times || [])] : [],
        date: (t && t.date) || isoDay(0),
        notify: t ? t.notify !== false : true,
        newTime: "",
        more: false,
        confirm: false,
        saving: false,
        error: "",
      };
      const scrim = this._openScrim("editor-scrim", () => this._closeEditor());
      scrim.oninput = (e) => {
        if (!this._editor) return;
        if (e.target.id === "gt-e-title") {
          this._editor.title = e.target.value;
          this._syncSave();
        }
        if (e.target.id === "gt-e-time") this._editor.newTime = e.target.value;
        if (e.target.id === "gt-e-date" && e.target.value) {
          this._editor.date = e.target.value;
          this._syncSave();
        }
      };
      scrim.onkeydown = (e) => {
        if (e.key !== "Enter" || !this._editor) return;
        if (e.target.id === "gt-e-time") {
          e.preventDefault();
          this._addTime(e.target.value);
        } else if (e.target.id === "gt-e-title") {
          e.preventDefault();
          this._saveTask();
        }
      };
      this._renderEditor();
      if (!t) setTimeout(() => scrim.querySelector("#gt-e-title") && scrim.querySelector("#gt-e-title").focus(), 60);
    }

    _closeEditor() {
      this._editor = null;
      this._hideScrim("editor-scrim");
      this._checkAlerts();
    }

    _addTime(value) {
      const ed = this._editor;
      if (!ed || !/^\d{1,2}:\d{2}/.test(value || "")) return;
      const t = value.slice(0, 5).padStart(5, "0");
      if (ed.repeat === "once") ed.times = [t]; // one time: one due time
      else if (!ed.times.includes(t) && ed.times.length < 6) ed.times = [...ed.times, t].sort();
      ed.newTime = "";
      this._renderEditor();
    }

    _syncSave() {
      const ed = this._editor;
      const btn = this.shadowRoot.querySelector(".editor-scrim [data-action=e-save]");
      if (!ed || !btn) return;
      const ok = ed.title.trim() && (ed.repeat !== "weekly" || ed.days.length) && (ed.repeat !== "once" || ed.date);
      btn.disabled = !ok || ed.saving;
    }

    _renderEditor() {
      const ed = this._editor;
      const scrim = this.shadowRoot.querySelector(".editor-scrim");
      if (!ed || !scrim) return;
      const scrollTop = scrim.querySelector(".sheet") ? scrim.querySelector(".sheet").scrollTop : 0;
      const people = this._people();
      const tab = (k, label) => `<button class="${ed.repeat === k ? "on" : ""}" data-action="e-repeat" data-repeat="${k}">${label}</button>`;
      const settled = scrim.querySelector(".sheet") ? " settled" : "";
      scrim.innerHTML = `
        <div class="sheet glass${settled}" style="--tint:${TINTS[ed.tint] || TINTS.clear}">
          <div class="sheet-head"><h2>${this._t(ed.id ? "edit_task" : "new_task")}</h2><button class="icon-btn" data-action="e-close" aria-label="${this._t("close")}">${ICON.close}</button></div>
          <section class="step">
            <h3 class="step-h"><i>1</i>${this._t("step_what")}</h3>
            <div class="pform-top">
              <span class="t-icon">${esc(ed.icon)}</span>
              <input id="gt-e-title" class="field" maxlength="60" placeholder="${esc(this._t("title_ph"))}" value="${esc(ed.title)}" autocomplete="off">
            </div>
            ${ed.id ? "" : `<div class="presets">${PRESETS.map((p, i) => `<button class="chip text" data-action="e-preset" data-i="${i}">${esc(p.icon)} ${esc(this._t(p.key))}</button>`).join("")}</div>`}
            <div class="label">${this._t("icon")}</div>
            <div class="emoji-grid">${TASK_ICONS.map((e) => `<button class="emoji ${e === ed.icon ? "on" : ""}" data-action="e-icon" data-emoji="${e}" aria-label="${esc(this._t("icon_e", { e }))}">${e}</button>`).join("")}</div>
          </section>
          <section class="step">
            <h3 class="step-h"><i>2</i>${this._t("step_often")}</h3>
            <div class="tabs">${tab("daily", this._t("rep_daily"))}${tab("weekly", this._t("rep_weekly"))}${tab("every", this._t("rep_every"))}${tab("once", this._t("rep_once"))}</div>
            ${
              ed.repeat === "once"
                ? `<div class="row">
                     ${[0, 1].map((o) => `<button class="chip text ${ed.date === isoDay(o) ? "on" : ""}" data-action="e-date" data-o="${o}">${this._t(o ? "q_tomorrow" : "q_today")}</button>`).join("")}
                     <input id="gt-e-date" class="field" type="date" value="${esc(ed.date)}" min="${isoDay(0)}" aria-label="${this._t("pick_day")}">
                   </div>
                   <p class="muted">${this._t("once_note")}</p>`
                : ed.repeat === "weekly"
                ? `<div class="days">${DAY_INDEX.map((d) => `<button class="chip text ${ed.days.includes(d) ? "on" : ""}" data-action="e-day" data-d="${d}" aria-pressed="${ed.days.includes(d)}">${esc(this._dayName(d))}</button>`).join("")}</div>`
                : ed.repeat === "every"
                  ? `<div class="stepper"><button class="icon-btn" data-action="e-every" data-step="-1" aria-label="${this._t("fewer_days")}">−</button><b>${esc(ed.every_days > 1 ? this._t("every_n", { n: ed.every_days }) : this._t("every_day"))}</b><button class="icon-btn" data-action="e-every" data-step="1" aria-label="${this._t("more_days")}">${ICON.plus}</button></div>
                     <p class="muted">${this._t("counted")}</p>`
                  : `<p class="muted">${ed.times.length > 1 ? this._t("n_times_hint", { n: ed.times.length }) : this._t("once_hint")}</p>`
            }
          </section>
          <section class="step">
            <h3 class="step-h"><i>3</i>${this._t("step_by")} <small>${this._t("optional")}</small></h3>
            <div class="time-list">
              ${ed.times.map((t) => `<span class="time-chip">${esc(this._hhmm(t))}<button data-action="e-untime" data-t="${t}" aria-label="${esc(this._t("remove_x", { x: this._hhmm(t) }))}">${ICON.close}</button></span>`).join("") || `<span class="muted">${this._t("any_time")}</span>`}
            </div>
            <div class="row">
              ${QUICK_TIMES.filter((q) => !ed.times.includes(q.t)).map((q) => `<button class="chip text" data-action="e-time" data-t="${q.t}">${esc(this._t(q.key))} · ${esc(this._hhmm(q.t))}</button>`).join("")}
            </div>
            <div class="row"><input id="gt-e-time" class="field" type="time" value="${esc(ed.newTime)}" aria-label="${this._t("another_time")}"><button class="small-btn" data-action="e-time-add">${this._t("add_time")}</button></div>
          </section>
          <section class="step">
            <h3 class="step-h"><i>4</i>${this._t("step_whose")}</h3>
            <div class="tiles">
              <button class="tile ${ed.assignee === "everyone" ? "on" : ""}" data-action="e-who" data-id="everyone"><span class="everyone-av">🏡</span><span>${esc(this._t("everyone"))}</span></button>
              ${people.map((p) => this._tile(p, "e-who", ed.assignee === p.id)).join("")}
            </div>
            ${people.length ? "" : `<p class="muted">${this._t("people_hint_html")}</p>`}
          </section>
          <button class="more ${ed.more ? "open" : ""}" data-action="e-more">${ICON.chevron}<span>${this._t("more_opts")}</span></button>
          <div ${ed.more ? "" : "hidden"}>
            <div class="row"><label>${this._t("colour")}</label><div class="chips">${Object.keys(TINTS)
              .map((k) => `<button class="tint-dot ${ed.tint === k ? "on" : ""}" data-action="e-tint" data-tint="${k}" style="--tint:${TINTS[k]}" aria-label="${this._t(`tint_${k}`)}" title="${this._t(`tint_${k}`)}"></button>`)
              .join("")}</div></div>
            <div class="toggle-row"><span>${this._t("remind_label")}</span><button class="switch ${ed.notify ? "on" : ""}" data-action="e-notify" role="switch" aria-checked="${ed.notify}" aria-label="${this._t("remind_aria")}"></button></div>
          </div>
          <div class="sheet-foot">
            <span class="err">${esc(ed.error)}</span>
            ${ed.id ? `<button class="ghost-btn danger" data-action="e-delete">${ICON.trash}<span>${this._t(ed.confirm ? "tap_delete" : "delete")}</span></button>` : ""}
            <button class="primary" data-action="e-save">${ICON.check}<span>${this._t(ed.id ? "save" : "add_task")}</span></button>
          </div>
        </div>`;
      const sheet = scrim.querySelector(".sheet");
      if (sheet) sheet.scrollTop = scrollTop;
      this._syncSave();
    }

    _tile(p, action, on) {
      return `<button class="tile ${on ? "on" : ""}" data-action="${action}" data-id="${esc(p.id)}" aria-pressed="${on}">${this._avatar(p)}<span>${esc(p.name)}</span></button>`;
    }

    async _saveTask() {
      const ed = this._editor;
      if (!ed || ed.saving) return;
      if (!ed.title.trim()) {
        ed.error = this._t("err_name");
        return this._renderEditor();
      }
      if (ed.repeat === "weekly" && !ed.days.length) {
        ed.error = this._t("err_day");
        return this._renderEditor();
      }
      if (ed.repeat === "once" && !ed.date) {
        ed.error = this._t("err_date");
        return this._renderEditor();
      }
      const payload = {
        type: "glass_tasks/task/save",
        title: ed.title.trim(),
        icon: ed.icon,
        tint: ed.tint,
        assignee: ed.assignee,
        repeat: ed.repeat,
        days: ed.repeat === "weekly" ? ed.days : [],
        every_days: ed.repeat === "every" ? ed.every_days : 1,
        times: ed.times,
        notify: ed.notify,
      };
      if (ed.repeat === "once") payload.date = ed.date;
      if (ed.id) payload.task_id = ed.id;
      ed.saving = true;
      ed.error = "";
      this._syncSave();
      try {
        await this._hass.callWS(payload);
        this._closeEditor();
      } catch (err) {
        if (!this._editor) return;
        this._editor.saving = false;
        this._editor.error = (err && err.message) || String(err);
        this._renderEditor();
      }
    }

    _onEditorClick(el, a) {
      const ed = this._editor;
      if (!ed) return;
      if (a !== "e-delete") ed.confirm = false;
      switch (a) {
        case "e-close":
          return this._closeEditor();
        case "e-save":
          return this._saveTask();
        case "e-preset": {
          const p = PRESETS[Number(el.dataset.i)];
          Object.assign(ed, { title: this._t(p.key), icon: p.icon, repeat: p.repeat, days: [...(p.days || [])], every_days: p.every_days || ed.every_days, times: [...p.times] });
          break;
        }
        case "e-icon":
          ed.icon = el.dataset.emoji;
          break;
        case "e-repeat":
          ed.repeat = el.dataset.repeat;
          if (ed.repeat === "weekly" && !ed.days.length) ed.days = [(new Date().getDay() + 6) % 7];
          if (ed.repeat === "once") {
            ed.times = ed.times.slice(0, 1);
            ed.date = ed.date || isoDay(0);
          }
          break;
        case "e-date":
          ed.date = isoDay(Number(el.dataset.o) || 0);
          break;
        case "e-day": {
          const d = Number(el.dataset.d);
          ed.days = ed.days.includes(d) ? ed.days.filter((x) => x !== d) : [...ed.days, d].sort();
          break;
        }
        case "e-every":
          ed.every_days = Math.min(365, Math.max(1, ed.every_days + Number(el.dataset.step)));
          break;
        case "e-time":
          return this._addTime(el.dataset.t);
        case "e-time-add":
          return this._addTime(this.shadowRoot.querySelector("#gt-e-time").value);
        case "e-untime":
          ed.times = ed.times.filter((t) => t !== el.dataset.t);
          break;
        case "e-who":
          ed.assignee = el.dataset.id;
          break;
        case "e-more":
          ed.more = !ed.more;
          break;
        case "e-tint":
          ed.tint = el.dataset.tint;
          break;
        case "e-notify":
          ed.notify = !ed.notify;
          break;
        case "e-delete":
          if (ed.confirm) {
            this._call({ type: "glass_tasks/task/delete", task_id: ed.id }).then((ok) => ok && this._closeEditor());
            return;
          }
          ed.confirm = true;
          break;
      }
      this._renderEditor();
    }

    _usedLook() {
      const used = new Set((this._members || []).map((m) => m.emoji));
      const emoji = MEMBER_EMOJI.find((e) => !used.has(e)) || MEMBER_EMOJI[hash(String(Date.now())) % MEMBER_EMOJI.length];
      const hue = HUES[(this._members || []).length % HUES.length];
      return { emoji, hue };
    }

    _resolveBackground(choice) {
      const bg = choice || (this._settings && this._settings.background) || {};
      if (bg.preset === "custom" && Array.isArray(bg.colors) && bg.colors.length === 3) {
        return { base: darkBase(bg.colors[0]), colors: bg.colors };
      }
      return BACKGROUNDS[bg.preset] || BACKGROUNDS[DEFAULT_BACKGROUND];
    }

    _applyBackground(choice) {
      if (!this._built) return;
      const t = this._resolveBackground(choice);
      const root = this.shadowRoot.querySelector(".root");
      root.style.setProperty("--gm-base", t.base);
      t.colors.forEach((c, i) => root.style.setProperty(`--gm-c${i + 1}`, c));
    }

    _openLook() {
      const bg = (this._settings && this._settings.background) || { preset: DEFAULT_BACKGROUND, colors: [] };
      const start = bg.preset === "custom" && bg.colors && bg.colors.length === 3 ? bg.colors : this._resolveBackground().colors;
      this._lookUi = { custom: [...start], error: "" };
      const scrim = this.shadowRoot.querySelector(".look-scrim");
      scrim.hidden = false;
      scrim.onclick = (e) => {
        if (e.target === scrim) this._closeLook();
      };
      scrim.oninput = (e) => {
        const i = e.target.dataset && e.target.dataset.ci;
        if (i === undefined || !this._lookUi) return;
        this._lookUi.custom[Number(i)] = e.target.value;
        this._applyBackground({ preset: "custom", colors: this._lookUi.custom });
        const prev = scrim.querySelector(".custom-prev");
        if (prev) prev.setAttribute("style", this._prevStyle(this._resolveBackground({ preset: "custom", colors: this._lookUi.custom })));
      };
      this._renderLook();
    }

    _closeLook() {
      this._lookUi = null;
      const s = this.shadowRoot.querySelector(".look-scrim");
      s.hidden = true;
      s.innerHTML = "";
      this._applyBackground();
      this._resetIdle();
    }

    _prevStyle(t) {
      return `--pb:${t.base};--p1:${t.colors[0]};--p2:${t.colors[1]};--p3:${t.colors[2]}`;
    }

    _renderLook() {
      const ui = this._lookUi;
      const scrim = this.shadowRoot.querySelector(".look-scrim");
      if (!ui || !scrim) return;
      const current = ((this._settings && this._settings.background) || {}).preset || DEFAULT_BACKGROUND;
      const scrollTop = scrim.querySelector(".sheet") ? scrim.querySelector(".sheet").scrollTop : 0;
      const option = (key, t) => `
        <button class="bg-opt ${current === key ? "on" : ""}" data-action="l-preset" data-preset="${key}" aria-pressed="${current === key}">
          <span class="bg-prev" style="${this._prevStyle(t)}"><i></i><i></i></span>
          <span class="bg-name"><span>${esc(this._t(`bg_${key}`))}${key === DEFAULT_BACKGROUND ? ` <small>${this._t("default")}</small>` : ""}</span>${current === key ? ICON.check : ""}</span>
        </button>`;
      const settled = scrim.querySelector(".sheet") ? " settled" : "";
      scrim.innerHTML = `
        <div class="sheet glass${settled}">
          <div class="sheet-head"><h2>${this._t("background")}</h2><button class="icon-btn" data-action="l-close" aria-label="${this._t("close")}">${ICON.close}</button></div>
          <p class="lead">${this._t("look_lead")}</p>
          <div class="bg-grid">${Object.entries(BACKGROUNDS).map(([k, t]) => option(k, t)).join("")}</div>
          <section class="people-sec card-inset">
            <h3>${this._t("own_colours")}</h3>
            <div class="custom-row">
              ${ui.custom
                .map((c, i) => `<label class="color-field">${this._t("colour_n", { n: i + 1 })}<input id="gm-l-c${i}" type="color" value="${esc(c)}" data-ci="${i}"></label>`)
                .join("")}
              <span class="bg-prev custom-prev" style="${this._prevStyle(this._resolveBackground({ preset: "custom", colors: ui.custom }))};flex:1;min-width:120px;height:48px"><i></i></span>
            </div>
            <p class="muted">${this._t("look_hint_html")}</p>
            <div class="pform-foot">
              <span class="err">${esc(ui.error)}</span>
              ${current === "custom" ? `<span class="muted">${ICON.check} ${this._t("in_use")}</span>` : ""}
              <button class="primary" data-action="l-custom">${this._t("use_mine")}</button>
            </div>
          </section>
        </div>`;
      const sheet = scrim.querySelector(".sheet");
      if (sheet) sheet.scrollTop = scrollTop;
    }

    async _saveBackground(background) {
      const prev = this._settings.background;
      this._settings = { ...this._settings, background };
      this._applyBackground();
      try {
        await this._hass.callWS({ type: "glass_tasks/settings", background });
      } catch (err) {
        this._settings = { ...this._settings, background: prev };
        this._applyBackground();
        if (this._lookUi) this._lookUi.error = (err && err.message) || String(err);
      }
      this._renderLook();
    }

    _onLookClick(el, a) {
      if (!this._lookUi) return;
      switch (a) {
        case "l-close":
          return this._closeLook();
        case "l-preset":
          this._lookUi.error = "";
          return this._saveBackground({ preset: el.dataset.preset, colors: [] });
        case "l-custom":
          this._lookUi.error = "";
          return this._saveBackground({ preset: "custom", colors: [...this._lookUi.custom] });
      }
    }

    // --------------------------------------------------------------- people
    _openPeople() {
      this._peopleUi = this._blankPerson();
      const scrim = this.shadowRoot.querySelector(".people-scrim");
      scrim.hidden = false;
      scrim.onclick = (e) => {
        if (e.target === scrim) this._closePeople();
      };
      scrim.oninput = (e) => {
        if (e.target.id === "gm-p-name" && this._peopleUi) this._peopleUi.name = e.target.value;
      };
      scrim.onchange = (e) => {
        if (e.target.id === "gm-p-notify" && this._peopleUi) this._peopleUi.notify = e.target.value;
      };
      scrim.onkeydown = (e) => {
        if (e.key === "Enter" && e.target.id === "gm-p-name") {
          e.preventDefault();
          this._savePerson();
        }
      };
      this._renderPeople();
      setTimeout(() => {
        const input = scrim.querySelector("#gm-p-name");
        if (input && !this._people().length) input.focus();
      }, 60);
    }

    _blankPerson() {
      return { editId: null, name: "", notify: "", confirm: null, error: "", ...this._usedLook() };
    }

    _closePeople() {
      this._peopleUi = null;
      const s = this.shadowRoot.querySelector(".people-scrim");
      s.hidden = true;
      s.innerHTML = "";
      this._resetIdle();
    }

    _renderPeople() {
      const ui = this._peopleUi;
      const scrim = this.shadowRoot.querySelector(".people-scrim");
      if (!ui || !scrim) return;
      const services = this._notifyServices();
      const label = (v) => (services.find((s) => s.value === v) || { label: String(v).replace(/^notify\./, "") }).label;
      const members = this._members || [];
      const ha = this._haPeople();
      const haOn = !(this._settings && this._settings.include_ha_people === false);
      const scrollTop = scrim.querySelector(".sheet") ? scrim.querySelector(".sheet").scrollTop : 0;
      const settled = scrim.querySelector(".sheet") ? " settled" : "";
      scrim.innerHTML = `
        <div class="sheet glass${settled}">
          <div class="sheet-head"><h2>${this._t("people")}</h2><button class="icon-btn" data-action="p-close" aria-label="${this._t("close")}">${ICON.close}</button></div>
          <p class="lead">${this._t("people_lead")}</p>
          <section class="card-inset">
            <h3>${this._t(ui.editId ? "edit_person" : "add_a_person")}</h3>
            <div class="pform-top">
              ${this._avatar({ id: "preview", name: ui.name || "?", emoji: ui.emoji, hue: ui.hue }, "xl")}
              <input id="gm-p-name" class="field" maxlength="40" placeholder="${esc(this._t("name_ph"))}" value="${esc(ui.name)}" autocomplete="off">
            </div>
            <div class="label">${this._t("picture")}</div>
            <div class="emoji-grid">${MEMBER_EMOJI.map((e) => `<button class="emoji ${e === ui.emoji ? "on" : ""}" data-action="p-emoji" data-emoji="${e}" aria-label="${esc(this._t("picture_e", { e }))}">${e}</button>`).join("")}</div>
            <div class="label">${this._t("colour")}</div>
            <div class="hues">${HUES.map((h) => `<button class="hue ${h === ui.hue ? "on" : ""}" data-action="p-hue" data-hue="${h}" style="--h:${h}" aria-label="${this._t("colour")}"></button>`).join("")}</div>
            <div class="label">${this._t("notify_label")} <span class="opt">${this._t("optional")}</span></div>
            <select id="gm-p-notify" class="field">
              <option value="">${this._t("dont_notify")}</option>
              ${services.map((s) => `<option value="${esc(s.value)}" ${s.value === ui.notify ? "selected" : ""}>${esc(s.label)}</option>`).join("")}
            </select>
            ${services.length ? "" : `<p class="muted">${this._t("install_app")}</p>`}
            <div class="pform-foot">
              <span class="err">${esc(ui.error)}</span>
              ${ui.editId ? `<button class="ghost-btn" data-action="p-cancel">${this._t("cancel")}</button>` : ""}
              <button class="primary" data-action="p-save">${ui.editId ? this._t("save_changes") : `${ICON.plus}<span>${this._t("add_person")}</span>`}</button>
            </div>
          </section>
          <section class="people-sec">
            <h3>${this._t("on_board")}</h3>
            ${
              members.length
                ? members
                    .map(
                      (m) => `<div class="person-row">${this._avatar({ id: m.id, name: m.name, emoji: m.emoji, hue: m.hue })}
                  <div class="pinfo"><b>${esc(m.name)}</b><small>${m.notify && m.notify.length ? esc(this._t("notifies", { x: label(m.notify[0]) })) : this._t("no_notifications")}</small></div>
                  <button class="ghost-btn" data-action="p-edit" data-id="${esc(m.id)}">${ICON.edit}<span>${this._t("edit")}</span></button>
                  <button class="ghost-btn danger" data-action="p-remove" data-id="${esc(m.id)}">${this._t(ui.confirm === m.id ? "tap_remove" : "remove")}</button></div>`
                    )
                    .join("")
                : `<p class="muted">${this._t("no_one")}</p>`
            }
          </section>
          ${
            ha.length
              ? `<section class="people-sec">
            <div class="sec-head"><h3>${this._t("ha_users")}</h3><button class="switch ${haOn ? "on" : ""}" data-action="p-ha" role="switch" aria-checked="${haOn}" aria-label="${this._t("show_ha")}"></button></div>
            <p class="muted">${this._t(haOn ? "ha_on" : "ha_off")}</p>
            ${haOn ? ha.map((p) => `<div class="person-row">${this._avatar(p)}<div class="pinfo"><b>${esc(p.name)}</b><small>${this._t("from_ha")}</small></div></div>`).join("") : ""}
          </section>`
              : ""
          }
        </div>`;
      const sheet = scrim.querySelector(".sheet");
      if (sheet) sheet.scrollTop = scrollTop;
    }

    async _savePerson() {
      const ui = this._peopleUi;
      if (!ui) return;
      const name = (ui.name || "").trim();
      if (!name) {
        ui.error = this._t("type_name_err");
        return this._renderPeople();
      }
      const payload = { type: "glass_tasks/member/save", name, emoji: ui.emoji, hue: ui.hue, notify: ui.notify ? [ui.notify] : [] };
      if (ui.editId) payload.member_id = ui.editId;
      try {
        const member = await this._hass.callWS(payload);
        this._members = [...this._members.filter((m) => m.id !== member.id), member].sort((a, b) => a.name.localeCompare(b.name));
        if (!this._peopleUi) return;
        this._peopleUi = this._blankPerson();
        this._renderPeople();
        this._renderFilters();
        this._renderBoard();
        const input = this.shadowRoot.querySelector("#gm-p-name");
        if (input) input.focus();
      } catch (err) {
        ui.error = (err && err.message) || String(err);
        this._renderPeople();
      }
    }

    _onPeopleClick(el, a) {
      const ui = this._peopleUi;
      if (!ui) return;
      switch (a) {
        case "p-close":
          return this._closePeople();
        case "p-emoji":
          ui.emoji = el.dataset.emoji;
          break;
        case "p-hue":
          ui.hue = Number(el.dataset.hue);
          break;
        case "p-save":
          return this._savePerson();
        case "p-cancel":
          this._peopleUi = this._blankPerson();
          break;
        case "p-edit": {
          const m = this._members.find((x) => x.id === el.dataset.id);
          if (m) this._peopleUi = { editId: m.id, name: m.name, emoji: m.emoji, hue: m.hue, notify: (m.notify || [])[0] || "", confirm: null, error: "" };
          const sheet = this.shadowRoot.querySelector(".people-scrim .sheet");
          if (sheet) sheet.scrollTo({ top: 0, behavior: "smooth" });
          break;
        }
        case "p-remove":
          if (ui.confirm === el.dataset.id) {
            this._call({ type: "glass_tasks/member/remove", member_id: el.dataset.id });
            ui.confirm = null;
            if (ui.editId === el.dataset.id) this._peopleUi = this._blankPerson();
          } else {
            ui.confirm = el.dataset.id;
          }
          break;
        case "p-ha":
          this._call({ type: "glass_tasks/settings", include_ha_people: this._settings.include_ha_people === false });
          break;
      }
      this._renderPeople();
    }

    // ------------------------------------------------------- overdue pop-up
    // When a task becomes overdue, a full-screen alert appears so it isn't missed.
    // Each screen remembers what was dismissed ("Got it") or snoozed, per due time,
    // so the alert comes back for the next due time but not for this one.
    _alertState(kind) {
      try {
        return JSON.parse(storage.get(ALERT_KEY + kind) || "{}") || {};
      } catch (e) {
        return {};
      }
    }

    _saveAlertState(kind, data) {
      const kept = Object.fromEntries(Object.entries(data).filter(([id]) => this._tasks.has(id)));
      storage.set(ALERT_KEY + kind, JSON.stringify(kept));
    }

    _snoozeMinutes() {
      return Math.min(240, Math.max(1, Number(this._config && this._config.alert_snooze) || 15));
    }

    _alertCandidates() {
      if (!this._loaded || (this._config && this._config.alert_overdue === false)) return [];
      const ack = this._alertState("ack");
      const snooze = this._alertState("snooze");
      const now = Date.now();
      return this._sorted()
        .filter((t) => t.status === "overdue" && ack[t.id] !== t.period_start && !(Number(snooze[t.id]) > now))
        .sort((a, b) => String(a.due_at || "~").localeCompare(String(b.due_at || "~")));
    }

    _checkAlerts() {
      if (!this._built) return;
      // Don't interrupt someone who is picking a name or editing; check again when they finish.
      if (this._pickId || this._editor) return;
      const list = this._alertCandidates();
      if (!list.length) {
        if (this._alertOpen) this._closeAlert();
        return;
      }
      const sig = list.map((t) => `${t.id}@${t.period_start}`).join("|");
      if (this._alertOpen && sig === this._alertSig) return;
      this._alertSeen = this._alertSeen || new Set();
      const fresh = list.some((t) => !this._alertSeen.has(`${t.id}@${t.period_start}`));
      list.forEach((t) => this._alertSeen.add(`${t.id}@${t.period_start}`));
      const wasOpen = this._alertOpen;
      this._alertSig = sig;
      this._alertIds = list.map((t) => t.id);
      this._alertOpen = true;
      if (this._ambient) this._setAmbient(false);
      this._renderAlert(wasOpen);
      if (fresh && this._config && this._config.alert_sound) this._chime();
    }

    _renderAlert(settled = false) {
      const scrim = this.shadowRoot.querySelector(".alert-scrim");
      const tasks = (this._alertIds || []).map((id) => this._tasks.get(id)).filter(Boolean);
      if (!scrim || !tasks.length) return;
      scrim.hidden = false;
      scrim.onclick = null; // a tap beside the alert doesn't dismiss it
      const whose = (t) => (!t.assignee || t.assignee === "everyone" ? this._t("everyones_job") : this._t("job", { name: this._person(t.assignee, this._t("someone")).name }));
      scrim.innerHTML = `
        <div class="od-wrap${settled ? " settled" : ""}"><div class="od-alert glass" role="alertdialog" aria-live="assertive" style="--tint:${OVERDUE_TINT}">
          <span class="bell" aria-hidden="true">⏰</span>
          <h2>${esc(this._t("alert_title"))}</h2>
          <p class="lead">${esc(tasks.length > 1 ? this._t("alert_many", { n: tasks.length }) : this._t("alert_one"))}</p>
          <ul class="alert-list">
            ${tasks
              .map(
                (t) => `<li>
              <span class="t-icon">${esc(t.icon || "✅")}</span>
              <span class="t-body"><span class="t-title">${esc(t.title)}</span><span class="t-status">${this._statusText(t)} · ${esc(whose(t))}</span></span>
              <button class="primary sm" data-action="x-done" data-id="${esc(t.id)}">${ICON.check}<span>${esc(this._t("alert_done"))}</span></button>
            </li>`
              )
              .join("")}
          </ul>
          <div class="sheet-foot">
            <button class="ghost-btn" data-action="x-snooze">${ICON.clock}<span>${esc(this._t("alert_snooze", { n: this._snoozeMinutes() }))}</span></button>
            <button class="ghost-btn" data-action="x-ok">${ICON.check}<span>${esc(this._t("alert_ok"))}</span></button>
          </div>
        </div></div>`;
    }

    _closeAlert() {
      this._alertOpen = false;
      this._alertSig = "";
      const scrim = this.shadowRoot.querySelector(".alert-scrim");
      if (scrim) {
        scrim.hidden = true;
        scrim.innerHTML = "";
      }
      this._resetIdle();
    }

    _onAlertClick(el, a) {
      const ids = this._alertIds || [];
      if (a === "x-done") {
        // Ask who did it. If the window is closed without an answer, the alert comes back.
        const id = el.dataset.id;
        this._closeAlert();
        this._openPick(id);
        return;
      }
      if (a === "x-snooze") {
        const snooze = this._alertState("snooze");
        const until = Date.now() + this._snoozeMinutes() * 60000;
        ids.forEach((id) => (snooze[id] = until));
        this._saveAlertState("snooze", snooze);
      } else if (a === "x-ok") {
        const ack = this._alertState("ack");
        ids.forEach((id) => {
          const t = this._tasks.get(id);
          if (t) ack[id] = t.period_start;
        });
        this._saveAlertState("ack", ack);
      }
      this._closeAlert();
    }

    _chime() {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        this._audio = this._audio || new Ctx();
        const ac = this._audio;
        if (ac.state === "suspended") ac.resume();
        [[880, 0], [660, 0.32], [880, 0.64]].forEach(([freq, at]) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          const t0 = ac.currentTime + at;
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, t0);
          gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
          osc.connect(gain).connect(ac.destination);
          osc.start(t0);
          osc.stop(t0 + 1);
        });
      } catch (e) {
        /* sound unavailable */
      }
    }

    // ------------------------------------------------------------ ambient
    _resetIdle() {
      clearTimeout(this._idleTimer);
      const after = Number(this._config && this._config.ambient_after) || 0;
      if (this._ambient) this._setAmbient(false);
      if (after > 0 && this.isConnected) {
        this._idleTimer = setTimeout(() => {
          if (!this._anySheet()) this._setAmbient(true);
          else this._resetIdle();
        }, after * 1000);
      }
    }

    _setAmbient(on) {
      if (on === this._ambient || !this._built) return;
      this._ambient = on;
      this.shadowRoot.querySelector(".root").classList.toggle("ambient-on", on);
      clearInterval(this._spotTimer);
      if (on) {
        this._spotIndex = 0;
        this._renderSpot(true);
        this._spotTimer = setInterval(() => {
          this._spotIndex++;
          this._renderSpot();
        }, 9000);
      } else {
        this._resetIdle();
      }
    }

    _spotlightList() {
      const rank = { overdue: 0, due: 1 };
      return this._sorted()
        .filter((t) => t.status in rank)
        .sort((a, b) => rank[a.status] - rank[b.status] || String(a.due_at || "~").localeCompare(String(b.due_at || "~")))
        .slice(0, 12);
    }

    _renderSpot(immediate = false) {
      const spot = this.shadowRoot.querySelector(".a-spot");
      if (!this._loaded || !this._tasks.size) {
        spot.style.display = "none";
        return;
      }
      spot.style.display = "";
      const list = this._spotlightList();
      const paint = () => {
        if (!list.length) {
          spot.style.setProperty("--tint", DONE_TINT);
          spot.innerHTML = `<div class="spot-row"><span class="t-icon">🎉</span><div><div class="t-title">${this._t("all_done")}</div><div class="t-status">${this._t("nothing_due")}</div></div></div>`;
        } else {
          const t = list[this._spotIndex % list.length];
          spot.style.setProperty("--tint", t.status === "overdue" ? OVERDUE_TINT : TINTS[t.tint] || TINTS.clear);
          spot.innerHTML = `<div class="spot-row"><span class="t-icon">${esc(t.icon || "✅")}</span><div><div class="t-title">${esc(t.title)}</div><div class="t-status">${this._statusText(t)}</div></div></div>`;
        }
        spot.classList.remove("out");
      };
      if (immediate) return paint();
      spot.classList.add("out");
      setTimeout(paint, 700);
    }
  }

  customElements.define(TAG, GlassTaskBoard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: TAG,
    name: "Glass Task Board",
    description: "A frosted-glass board for recurring household tasks: tap when done, it resets on its own.",
    preview: false,
    documentationURL: "https://github.com/Degederon/GlassTaskBoard",
  });
  console.info(`%c GLASS TASK BOARD %c ${VERSION} `, "background:#22c58b;color:#fff;border-radius:4px 0 0 4px;padding:2px 6px", "background:#5b6cff;color:#fff;border-radius:0 4px 4px 0;padding:2px 6px");
})();
