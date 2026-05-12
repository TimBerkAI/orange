"""
# Replace scheduled_at with start_at / end_at on Visit

1. Modified Tables
   - `patients_visit`
     - Rename `scheduled_at` -> `start_at`
     - Add `end_at` (DateTimeField) defaulting to start_at + 30 min for existing rows
2. Ordering changed from `-scheduled_at` to `-start_at`
"""

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0002_populate_teeth'),
    ]

    operations = [
        migrations.RenameField(
            model_name='visit',
            old_name='scheduled_at',
            new_name='start_at',
        ),
        migrations.AddField(
            model_name='visit',
            name='end_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.RunSQL(
            sql="UPDATE patients_visit SET end_at = start_at + INTERVAL '30 minutes' WHERE end_at = start_at;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.AlterModelOptions(
            name='visit',
            options={'ordering': ['-start_at']},
        ),
    ]
