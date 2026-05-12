from datetime import timedelta

MIN_DURATION = timedelta(minutes=5)
MAX_DURATION = timedelta(hours=10)


def validate_appointment_times(start_at, end_at):
    if end_at <= start_at:
        raise ValueError('Время окончания должно быть позже времени начала')

    duration = end_at - start_at
    if duration < MIN_DURATION:
        raise ValueError('Минимальная длительность приёма — 5 минут')

    if duration > MAX_DURATION:
        raise ValueError('Максимальная длительность приёма — 10 часов')
