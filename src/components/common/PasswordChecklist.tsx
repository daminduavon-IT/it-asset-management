import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES } from '../../utils/passwordRules';

/** Live checklist of the password rules, ticking each one off as the typed password meets it. */
export default function PasswordChecklist({ password }: { password: string }) {
    return (
        <ul className="space-y-1 text-xs" aria-label="Password requirements">
            {PASSWORD_RULES.map(rule => {
                const met = rule.test(password);
                const Icon = met ? Check : Circle;
                return (
                    <li key={rule.label} className={`flex items-center gap-1.5 ${met ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                        {rule.label}
                        <span className="sr-only">{met ? ' (met)' : ' (not met yet)'}</span>
                    </li>
                );
            })}
        </ul>
    );
}
