// whisperAnalyzer.js — The Whisper Network
// Surfaces unanswered questions from PR comments and issues

class WhisperAnalyzer {
    analyze(pullRequests, issues) {
        const whispers = [];
        const now = Date.now();

        // Analyze PRs for unanswered threads
        (pullRequests || []).forEach(pr => {
            const body = pr.body || '';
            const questions = this._extractQuestions(body, pr.user?.login);

            questions.forEach(q => {
                const daysAgo = Math.floor((now - new Date(pr.created_at).getTime()) / (1000 * 60 * 60 * 24));

                // If PR is merged/closed without the question being obviously answered
                if ((pr.state === 'closed' || pr.state === 'merged') && daysAgo > 14) {
                    whispers.push({
                        type: 'pr_question',
                        author: pr.user?.login || 'unknown',
                        question: q,
                        context: `PR #${pr.number}: ${pr.title}`,
                        askedAt: pr.created_at,
                        daysAgo,
                        prState: pr.state
                    });
                }
            });

            // Self-answered PRs with no review — the question is the whole PR
            if (pr.state === 'closed' && !pr.merged_at && pr.comments === 0) {
                const daysAgo = Math.floor((now - new Date(pr.created_at).getTime()) / (1000 * 60 * 60 * 24));
                if (daysAgo > 30) {
                    whispers.push({
                        type: 'closed_pr_no_discussion',
                        author: pr.user?.login || 'unknown',
                        question: `${pr.user?.login || 'Someone'} opened "${pr.title}" and it was closed with no discussion. The question it was asking — whatever it was — was never answered.`,
                        context: `PR #${pr.number}`,
                        askedAt: pr.created_at,
                        daysAgo,
                        prState: pr.state
                    });
                }
            }
        });

        // Analyze open issues with no responses
        (issues || []).filter(i => i.state === 'open' && i.comments === 0).forEach(issue => {
            const daysAgo = Math.floor((now - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24));
            if (daysAgo > 30) {
                const questions = this._extractQuestions(issue.body || '', issue.user?.login);
                const question = questions[0] || `${issue.user?.login || 'Someone'} filed "${issue.title}". Nobody responded. It is still open.`;

                whispers.push({
                    type: 'unanswered_issue',
                    author: issue.user?.login || 'unknown',
                    question: this._formatWhisper(issue.user?.login, issue.title, question, daysAgo),
                    context: `Issue #${issue.number}: ${issue.title}`,
                    askedAt: issue.created_at,
                    daysAgo,
                    issueTitle: issue.title
                });
            }
        });

        // Sort by daysAgo descending (oldest unanswered first)
        whispers.sort((a, b) => b.daysAgo - a.daysAgo);

        const topWhispers = whispers.slice(0, 8);

        let finding;
        if (topWhispers.length === 0) {
            finding = 'No whispers detected. Questions appear to be answered and issues are being addressed.';
        } else if (topWhispers.length >= 5) {
            const oldest = topWhispers[0];
            finding = `${topWhispers.length} unanswered questions found in the communication history. The oldest has been waiting ${oldest.daysAgo} days. Some of these may have shaped the codebase without ever being resolved.`;
        } else {
            finding = `${topWhispers.length} unanswered question${topWhispers.length > 1 ? 's' : ''} found in PR and issue history. Communication debt in the repo that never fully resolved.`;
        }

        return { whispers: topWhispers, finding };
    }

    _extractQuestions(text, author) {
        if (!text) return [];
        const sentences = text.replace(/\n/g, ' ').split(/[.!?]+/);
        return sentences
            .filter(s => s.includes('?'))
            .map(s => s.trim())
            .filter(s => s.length > 20 && s.length < 200)
            .slice(0, 2);
    }

    _formatWhisper(author, issueTitle, question, daysAgo) {
        const authorStr = author ? `@${author}` : 'Someone';
        const months = Math.round(daysAgo / 30);
        const timeStr = months >= 2 ? `${months} months ago` : `${daysAgo} days ago`;

        if (question && question.includes('?')) {
            return `${authorStr} asked: "${question.trim()}" Nobody answered. ${timeStr}.`;
        }
        return `${authorStr} raised "${issueTitle}". No response. Still open. ${timeStr}.`;
    }
}

module.exports = WhisperAnalyzer;
