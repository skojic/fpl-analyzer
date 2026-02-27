// FPL Points Prediction and Transfer Suggestion Module
const Predictor = {
    // FPL Scoring Rules
    SCORING_RULES: {
        // Minutes played
        minutesPlayed: { threshold: 60, points: 2, underThreshold: 1 },

        // Goals scored
        goals: {
            GKP: 6,
            DEF: 6,
            MID: 5,
            FWD: 4
        },

        // Assists
        assists: 3,

        // Clean sheets
        cleanSheets: {
            GKP: 6,
            DEF: 6,
            MID: 1,
            FWD: 0
        },

        // Goals conceded (per 2 goals)
        goalsConceded: {
            GKP: -1,
            DEF: -1,
            MID: 0,
            FWD: 0
        },

        // Saves (per 3 saves)
        saves: {
            GKP: 1,
            other: 0
        },

        // Bonus points
        bonus: 1, // per bonus point

        // Penalties
        penaltySaved: 5,
        penaltyMissed: -2,

        // Cards
        yellowCard: -1,
        redCard: -3,

        // Own goals
        ownGoal: -2
    },

    // Calculate expected points for next fixture based on stats and FPL rules
    calculateExpectedPoints(player, fixture) {
        let expectedPoints = 0;

        // Safe value getter with defaults
        const safeValue = (value, defaultVal = 0) => {
            const num = parseFloat(value);
            return isNaN(num) ? defaultVal : num;
        };

        // Base points for playing (assume based on starts and minutes)
        const minutes = safeValue(player.minutes, 0);
        const starts = safeValue(player.starts, 0);
        const gamesPlayed = minutes > 0 ? minutes / 90 : 1;
        const startProbability = gamesPlayed > 0 ? Math.min(starts / gamesPlayed, 1) : 0.7;

        // Playing chance
        const playingChance = player.chanceOfPlayingNextRound ?
            (player.chanceOfPlayingNextRound / 100) * startProbability : startProbability;

        // Expect 2 points for playing (if > 60 mins) - FPL rule
        expectedPoints += 2 * playingChance;

        // Get form multiplier
        const form = safeValue(player.form, 3);
        const ppg = safeValue(player.pointsPerGame, 2);
        const formMultiplier = form > 0 ? Math.min(form / ppg, 2) : 0.8; // Cap at 2x, min 0.8x

        // Use xG per 90 for more accurate goal predictions
        const xGPer90 = safeValue(player.expectedGoalsPer90, 0);
        const expectedGoalsForFixture = this.adjustForDifficulty(
            xGPer90 * formMultiplier,
            fixture.difficulty,
            true
        );

        // Apply FPL goal scoring rules based on position
        const goalPoints = this.SCORING_RULES.goals[player.position] || 4;
        expectedPoints += expectedGoalsForFixture * goalPoints;

        // Use xA per 90 for assists
        const xAPer90 = safeValue(player.expectedAssistsPer90, 0);
        const expectedAssistsForFixture = this.adjustForDifficulty(
            xAPer90 * formMultiplier,
            fixture.difficulty,
            true
        );
        expectedPoints += expectedAssistsForFixture * this.SCORING_RULES.assists;

        // ── Clean sheet, goals conceded & goalkeeper saves ──────────────────
        if (player.position === 'GKP' || player.position === 'DEF') {
            // 1. CS probability driven by player's own xGC per 90
            //    xGC 0.5 → ~57% CS, xGC 1.0 → ~35%, xGC 1.5 → ~18%
            const rawXGC = safeValue(player.expectedGoalsConcededPer90, 0);
            const goalsConceded = safeValue(player.goalsConceded, 0);
            // Fall back to historical GC rate if xGC unavailable
            const xGCPer90 = rawXGC > 0 ? rawXGC : (gamesPlayed > 0 ? goalsConceded / gamesPlayed : 0.9);

            // Convert xGC to CS probability: lower xGC = better defensive record
            const baseCSProb = Math.max(0.05, Math.min(0.70, 1 - (xGCPer90 * 0.65)));

            // 2. Scale by fixture difficulty (FDR 1 = easy, 5 = hard)
            const fdrMultipliers = { 1: 1.30, 2: 1.15, 3: 1.00, 4: 0.78, 5: 0.52 };
            const fdrMult = fdrMultipliers[fixture.difficulty] || 1.0;
            const cleanSheetProb = Math.min(0.80, baseCSProb * fdrMult);

            // 3. CS points (GKP = 6, DEF = 6)
            const csPoints = this.SCORING_RULES.cleanSheets[player.position];
            expectedPoints += cleanSheetProb * csPoints;

            // 4. MID clean sheet 1pt (handled separately below)

            // 5. Goals conceded penalty — harder fixtures raise xGC
            //    Expected GC = xGC adjusted inversely to CS probability
            const expectedGC = xGCPer90 * (1 / fdrMult);
            const gcPenalty = Math.floor(expectedGC / 2) * (this.SCORING_RULES.goalsConceded[player.position] || 0);
            expectedPoints += gcPenalty; // negative value
        }

        // MID clean sheet (1pt)
        if (player.position === 'MID') {
            const fdrMultipliers = { 1: 1.30, 2: 1.15, 3: 1.00, 4: 0.78, 5: 0.52 };
            const fdrMult = fdrMultipliers[fixture.difficulty] || 1.0;
            const midCSProb = Math.max(0.03, 0.28 * fdrMult);
            expectedPoints += midCSProb * this.SCORING_RULES.cleanSheets.MID;
        }

        // Bonus points based on BPS
        const bps = safeValue(player.bps, 0);
        const bpsPerGame = gamesPlayed > 0 ? bps / gamesPlayed : 0;
        // Approximate bonus probability: BPS > 30 per game often gets bonus
        const bonusProb = Math.min(bpsPerGame / 40, 0.8);
        const avgBonusWhenReceived = 2;
        expectedPoints += bonusProb * avgBonusWhenReceived;

        // ── Goalkeeper saves (per 3 saves = 1pt) ────────────────────────────
        if (player.position === 'GKP') {
            // Use saves per start rather than per 90 to avoid double-counting
            const totalSaves = safeValue(player.saves, 0);
            const savesPerGame = starts > 0 ? totalSaves / starts : safeValue(player.savesPer90, 0);
            // Harder fixtures → more saves expected
            const fdrSaveMult = { 1: 0.75, 2: 0.88, 3: 1.00, 4: 1.18, 5: 1.40 }[fixture.difficulty] || 1.0;
            const expectedSaves = savesPerGame * fdrSaveMult * playingChance;
            expectedPoints += Math.floor(expectedSaves / 3) * this.SCORING_RULES.saves.GKP;

            // Penalty save probability (~3% chance of a penalty per game)
            const penaltiesSaved = safeValue(player.penaltiesSaved, 0);
            const penSaveProb = penaltiesSaved > 0
                ? Math.min(0.08, (penaltiesSaved / Math.max(1, gamesPlayed)) * 0.5)
                : 0.025;
            expectedPoints += penSaveProb * this.SCORING_RULES.penaltySaved;

            // Defensive BPS contribution for GKP (saves, sweeping)
            if (bpsPerGame > 28) expectedPoints += 1.5;
            else if (bpsPerGame > 20) expectedPoints += 0.8;
        }

        // ── Defensive BPS bonus for outfield DEF ─────────────────────────────
        if (player.position === 'DEF') {
            // BPS captures tackles, interceptions, clearances
            if (bpsPerGame > 30) expectedPoints += 1.2;
            else if (bpsPerGame > 22) expectedPoints += 0.6;
            else if (bpsPerGame > 15) expectedPoints += 0.2;
        }

        // Penalty taker bonus
        const penOrder = safeValue(player.penaltiesOrder, 99);
        if (penOrder === 1) {
            // First choice penalty taker - small boost
            expectedPoints += 0.3; // Average penalty opportunity impact
        }

        // Yellow card probability (negative points)
        const yellowCards = safeValue(player.yellowCards, 0);
        const yellowCardRate = gamesPlayed > 0 ? yellowCards / gamesPlayed : 0;
        expectedPoints += yellowCardRate * this.SCORING_RULES.yellowCard;

        // Apply playing chance to final score
        const finalPoints = expectedPoints * playingChance;
        return isNaN(finalPoints) || finalPoints < 0 ? 0 : finalPoints;
    },

    // Adjust expected value based on fixture difficulty
    adjustForDifficulty(baseValue, difficulty, isAttacking) {
        // Safety check for baseValue
        if (isNaN(baseValue) || baseValue === null || baseValue === undefined) {
            baseValue = 0;
        }

        const difficultyMultipliers = {
            1: isAttacking ? 1.3 : 0.7,
            2: isAttacking ? 1.15 : 0.85,
            3: 1.0,
            4: isAttacking ? 0.85 : 1.15,
            5: isAttacking ? 0.7 : 1.3
        };

        const result = baseValue * (difficultyMultipliers[difficulty] || 1);
        return isNaN(result) ? 0 : result;
    },

    // Predict points for next 5 gameweeks
    async predictNext5Gameweeks(player) {
        const fixtures = await FPL_API.getPlayerFixtureDifficulty(player.id);

        if (!fixtures || fixtures.length === 0) {
            return [];
        }

        return fixtures.map(fixture => {
            const expectedPoints = this.calculateExpectedPoints(player, fixture);
            const roundedPoints = Math.round(expectedPoints * 10) / 10;
            return {
                ...fixture,
                expectedPoints: isNaN(roundedPoints) ? 0 : roundedPoints
            };
        });
    },

    // Calculate total expected points for next 5 gameweeks
    async calculatePlayerNext5GWPoints(player) {
        const predictions = await this.predictNext5Gameweeks(player);

        if (!predictions || predictions.length === 0) {
            return 0;
        }

        const total = predictions.reduce((sum, pred) => {
            const points = parseFloat(pred.expectedPoints) || 0;
            return sum + points;
        }, 0);

        const rounded = Math.round(total * 10) / 10;
        return isNaN(rounded) ? 0 : rounded;
    },

    // Predict team points for next gameweek
    async predictTeamPoints(team) {
        if (!team || team.length === 0) {
            return [];
        }

        const predictions = await Promise.all(
            team.map(async player => {
                const fixtures = await this.predictNext5Gameweeks(player);
                const nextFixture = fixtures && fixtures.length > 0 ? fixtures[0] : null;
                const expectedPoints = nextFixture ? parseFloat(nextFixture.expectedPoints) || 0 : 0;
                return {
                    player,
                    expectedPoints: isNaN(expectedPoints) ? 0 : expectedPoints
                };
            })
        );

        return predictions;
    },

    // Calculate comprehensive player score using extended statistics
    calculatePlayerScore(player) {
        const safeValue = (value, defaultVal = 0) => {
            const num = parseFloat(value);
            return isNaN(num) ? defaultVal : num;
        };

        // Get all metrics
        const form = safeValue(player.form, 3);
        const ppg = safeValue(player.pointsPerGame, 2);
        const minutes = safeValue(player.minutes, 0);
        const xGPer90 = safeValue(player.expectedGoalsPer90, 0);
        const xAPer90 = safeValue(player.expectedAssistsPer90, 0);
        const xGIPer90 = safeValue(player.expectedGoalInvolvementsPer90, 0);
        const bps = safeValue(player.bps, 0);
        const ictIndex = safeValue(player.ictIndex, 0);
        const starts = safeValue(player.starts, 0);
        const bonus = safeValue(player.bonus, 0);

        // Minutes played factor (prefer regular starters)
        const gamesPlayed = minutes > 0 ? minutes / 90 : 1;
        const minutesFactor = Math.min(minutes / 1000, 1.5); // Cap at 1.5x for high minutes

        // Starting probability (based on starts vs games played)
        const startProbability = gamesPlayed > 0 ? starts / gamesPlayed : 0.5;

        // Calculate position-specific scores
        let score = 0;

        // Base score from form and PPG (40% weight)
        score += (form * 3 + ppg * 2) * 0.4;

        // Expected stats score (30% weight)
        if (player.position === 'GKP') {
            // GKP: weighted by CS per start, saves per start, defensive solidity (xGC), minutes base
            const cleanSheets = safeValue(player.cleanSheets, 0);
            const totalSaves = safeValue(player.saves, 0);
            const xGCPer90 = safeValue(player.expectedGoalsConcededPer90, 0);

            // CS per start — primary GKP earner (6 pts each)
            const csPerStart = starts > 0 ? cleanSheets / starts : (gamesPlayed > 0 ? cleanSheets / gamesPlayed : 0);
            const csScore = csPerStart * 38;

            // Saves per start — bonus potential and workload indicator
            const savesPerStart = starts > 0 ? totalSaves / starts : 0;
            const savesScore = Math.min(28, savesPerStart * 3.2);

            // xGC per 90: lower = better defensive team, more CS potential
            const defenceScore = xGCPer90 > 0 ? Math.max(0, (1.8 - xGCPer90) * 10) : 5;

            // Minutes as base reliability: rewards nailed-on starters over backups
            const minutesScore = Math.min(12, (minutes / 2700) * 12);

            score += (csScore * 0.38) + (savesScore * 0.28) + (defenceScore * 0.20) + (minutesScore * 0.14);
        } else if (player.position === 'DEF') {
            // Defensive score: xGC (lower = better), CS ratio, BPS, attacking contribution
            const xGCPer90 = safeValue(player.expectedGoalsConcededPer90, 0);
            const rawGC = safeValue(player.goalsConceded, 0);
            const effectiveXGC = xGCPer90 > 0 ? xGCPer90 : (gamesPlayed > 0 ? rawGC / gamesPlayed : 1.0);

            // Lower xGC = better: score rises as xGC falls below 1.5
            const defenceScore = Math.max(0, (1.8 - effectiveXGC) * 18);

            // Clean sheet ratio (CS per start)
            const cleanSheets = safeValue(player.cleanSheets, 0);
            const csRatio = starts > 0 ? cleanSheets / starts : 0;
            const csScore = csRatio * 30;

            // BPS per game — proxy for tackles, clearances, interceptions
            const bpsPerGame = gamesPlayed > 0 ? bps / gamesPlayed : 0;
            const bpsScore = Math.min(20, bpsPerGame * 0.55);

            // Attacking threat (xGI still matters for attacking defenders)
            const attackScore = xGIPer90 * 12;

            score += (defenceScore * 0.30 + csScore * 0.30 + bpsScore * 0.25 + attackScore * 0.15);
        } else if (player.position === 'MID') {
            // Midfielders balanced on goals and assists
            score += (xGIPer90 * 20) * 0.3;
        } else { // FWD
            // Forwards prioritize goals
            score += (xGPer90 * 25 + xAPer90 * 10) * 0.3;
        }

        // BPS and ICT contribute (20% weight)
        const bpsPerGame = gamesPlayed > 0 ? bps / gamesPlayed : 0;
        const ictPerGame = gamesPlayed > 0 ? ictIndex / gamesPlayed : 0;
        score += (bpsPerGame / 10 + ictPerGame / 20) * 0.2;

        // Bonus factor (10% weight)
        const bonusPerGame = gamesPlayed > 0 ? bonus / gamesPlayed : 0;
        score += bonusPerGame * 1.5 * 0.1;

        // Apply minutes and start probability multipliers
        score *= minutesFactor;
        score *= (0.5 + startProbability * 0.5); // Reduce score for rotation risks

        // Availability penalty
        const chanceOfPlaying = safeValue(player.chanceOfPlayingNextRound, 100);
        if (chanceOfPlaying < 100) {
            score *= (chanceOfPlaying / 100);
        }

        return Math.max(0, score);
    },

    // Find best transfer options - GKP (top 2) + 3 per outfield position group
    async findBestTransfers(currentTeam, allPlayers, budget) {
        const positionLimits = { GKP: 2, DEF: 3, MID: 3, FWD: 3 };
        const transferOptionsByPosition = {
            GKP: [],
            DEF: [],
            MID: [],
            FWD: []
        };

        // Get current team player IDs
        const currentPlayerIds = currentTeam.map(p => p.id);

        // Calculate scores for all available players
        const playersWithScores = allPlayers
            .filter(p => !currentPlayerIds.includes(p.id) && p.status === 'a')
            .map(player => ({
                ...player,
                comprehensiveScore: this.calculatePlayerScore(player)
            }));

        // Calculate expected points for current team
        const currentTeamWithPredictions = await Promise.all(
            currentTeam.map(async player => {
                const next5GWPoints = await this.calculatePlayerNext5GWPoints(player);
                const score = this.calculatePlayerScore(player);
                return {
                    ...player,
                    expectedNext5GW: next5GWPoints,
                    comprehensiveScore: score
                };
            })
        );

        // Process each position group (GKP, DEF, MID, FWD)
        for (const targetPosition of ['GKP', 'DEF', 'MID', 'FWD']) {
            // Get current players in this position, sorted by score (weakest first)
            const currentInPosition = currentTeamWithPredictions
                .filter(p => p.position === targetPosition)
                .sort((a, b) => a.comprehensiveScore - b.comprehensiveScore);

            if (currentInPosition.length === 0) continue;

            // Look at weakest 60% of players in this position
            const weakestCount = Math.max(1, Math.ceil(currentInPosition.length * 0.6));
            const weakestInPosition = currentInPosition.slice(0, weakestCount);

            for (const currentPlayer of weakestInPosition) {
                // Find potential replacements in same position
                const replacements = playersWithScores.filter(p => {
                    const price = parseFloat(p.price) || 0;
                    const currentPrice = parseFloat(currentPlayer.price) || 0;
                    const safeChance = parseFloat(p.chanceOfPlayingNextRound) || 100;

                    return p.position === targetPosition &&
                        price <= currentPrice + budget &&
                        safeChance >= 75 &&
                        p.comprehensiveScore > currentPlayer.comprehensiveScore * 0.85; // Allow slight improvements
                });

                // Sort by comprehensive score
                replacements.sort((a, b) => b.comprehensiveScore - a.comprehensiveScore);

                // Take top 5 for consideration
                const topReplacements = replacements.slice(0, 5);

                for (const replacement of topReplacements) {
                    const replacementExpected = await this.calculatePlayerNext5GWPoints(replacement);
                    const currentExpected = parseFloat(currentPlayer.expectedNext5GW) || 0;
                    const pointsGain = replacementExpected - currentExpected;

                    const currentPrice = parseFloat(currentPlayer.price) || 0;
                    const replacementPrice = parseFloat(replacement.price) || 0;
                    const roundedGain = Math.round(pointsGain * 10) / 10;

                    // Calculate a transfer priority score
                    const scoreDiff = replacement.comprehensiveScore - currentPlayer.comprehensiveScore;
                    const transferPriority = scoreDiff + pointsGain;

                    transferOptionsByPosition[targetPosition].push({
                        out: currentPlayer,
                        in: replacement,
                        cost: replacementPrice - currentPrice,
                        expectedPointsGain: isNaN(roundedGain) ? 0 : roundedGain,
                        scoreDifference: Math.round(scoreDiff * 10) / 10,
                        transferPriority: Math.round(transferPriority * 10) / 10,
                        reason: this.getTransferReason(currentPlayer, replacement),
                        position: targetPosition
                    });
                }
            }

            // Sort this position's transfers by priority
            transferOptionsByPosition[targetPosition].sort((a, b) =>
                b.transferPriority - a.transferPriority
            );

            // Ensure we have at least 3 for this position if possible
            if (transferOptionsByPosition[targetPosition].length < 3 && currentInPosition.length > 0) {
                // Relax constraints to get more options
                for (const currentPlayer of currentInPosition) {
                    if (transferOptionsByPosition[targetPosition].length >= 3) break;

                    const replacements = playersWithScores.filter(p => {
                        const price = parseFloat(p.price) || 0;
                        const currentPrice = parseFloat(currentPlayer.price) || 0;

                        return p.position === targetPosition &&
                            price <= currentPrice + budget + 1.5 && // Allow up to 1.5m over
                            p.comprehensiveScore > currentPlayer.comprehensiveScore * 0.8; // Allow more similar players
                    });

                    replacements.sort((a, b) => b.comprehensiveScore - a.comprehensiveScore);

                    const alreadyHasOut = transferOptionsByPosition[targetPosition]
                        .find(tr => tr.out.id === currentPlayer.id);

                    if (replacements.length > 0 && !alreadyHasOut) {
                        const replacement = replacements[0];
                        const replacementExpected = await this.calculatePlayerNext5GWPoints(replacement);
                        const currentExpected = parseFloat(currentPlayer.expectedNext5GW) || 0;
                        const pointsGain = replacementExpected - currentExpected;
                        if (pointsGain < 1.0) continue; // skip if not a meaningful improvement
                        const scoreDiff = replacement.comprehensiveScore - currentPlayer.comprehensiveScore;

                        transferOptionsByPosition[targetPosition].push({
                            out: currentPlayer,
                            in: replacement,
                            cost: replacement.price - currentPlayer.price,
                            expectedPointsGain: Math.round(pointsGain * 10) / 10,
                            scoreDifference: Math.round(scoreDiff * 10) / 10,
                            transferPriority: Math.round((scoreDiff + pointsGain) * 10) / 10,
                            reason: this.getTransferReason(currentPlayer, replacement),
                            position: targetPosition
                        });
                    }
                }
            }

            // Take position limit (GKP=2, outfield=3)
            const limit = positionLimits[targetPosition] || 3;
            transferOptionsByPosition[targetPosition] = transferOptionsByPosition[targetPosition].slice(0, limit);
        }

        // Combine all position groups (GKP first, then outfield)
        const allTransfers = [
            ...transferOptionsByPosition.GKP,
            ...transferOptionsByPosition.DEF,
            ...transferOptionsByPosition.MID,
            ...transferOptionsByPosition.FWD
        ].filter(tr => (tr.expectedPointsGain || 0) >= 1.0);

        return allTransfers;
    },

    // Get reason for transfer suggestion
    getTransferReason(playerOut, playerIn) {
        const reasons = [];

        const outForm = parseFloat(playerOut.form) || 0;
        const outChance = parseFloat(playerOut.chanceOfPlayingNextRound) || 100;
        const inForm = parseFloat(playerIn.form) || 0;
        const inSelectedBy = parseFloat(playerIn.selectedBy) || 0;
        const inPPG = parseFloat(playerIn.pointsPerGame) || 0;
        const outPPG = parseFloat(playerOut.pointsPerGame) || 0;
        const inXGI = parseFloat(playerIn.expectedGoalInvolvementsPer90) || 0;
        const outXGI = parseFloat(playerOut.expectedGoalInvolvementsPer90) || 0;
        const inBPS = parseFloat(playerIn.bps) || 0;
        const outBPS = parseFloat(playerOut.bps) || 0;
        const inMinutes = parseFloat(playerIn.minutes) || 0;
        const outMinutes = parseFloat(playerOut.minutes) || 0;

        // Defensive-specific reasons (DEF / GKP)
        if (playerOut.position === 'DEF' || playerOut.position === 'GKP') {
            const outXGC = parseFloat(playerOut.expectedGoalsConcededPer90) || 0;
            const inXGC = parseFloat(playerIn.expectedGoalsConcededPer90) || 0;
            const outCS = parseFloat(playerOut.cleanSheets) || 0;
            const inCS = parseFloat(playerIn.cleanSheets) || 0;
            const outStarts = Math.max(1, parseFloat(playerOut.starts) || 1);
            const inStarts = Math.max(1, parseFloat(playerIn.starts) || 1);
            const outCSRate = outCS / outStarts;
            const inCSRate = inCS / inStarts;

            if (outXGC > 0 && inXGC > 0 && inXGC < outXGC * 0.80) {
                reasons.push(`Better defensive record (xGC/90: ${inXGC.toFixed(2)} vs ${outXGC.toFixed(2)})`);
            }
            if (inCSRate > outCSRate + 0.10) {
                reasons.push(`Higher clean sheet rate (${(inCSRate * 100).toFixed(0)}% vs ${(outCSRate * 100).toFixed(0)}%)`);
            }
            if (playerOut.position === 'GKP') {
                const outSaves = parseFloat(playerOut.saves) || 0;
                const inSaves = parseFloat(playerIn.saves) || 0;
                const outSavesPerGame = outSaves / outStarts;
                const inSavesPerGame = inSaves / inStarts;
                if (inSavesPerGame > outSavesPerGame * 1.2 && inSavesPerGame > 3) {
                    reasons.push(`More saves per game (${inSavesPerGame.toFixed(1)} vs ${outSavesPerGame.toFixed(1)})`);
                }

                // GKP-specific: minutes reliability
                const outMins = parseFloat(playerOut.minutes) || 0;
                const inMins = parseFloat(playerIn.minutes) || 0;
                if (inMins > outMins * 1.15 && inMins > 900) {
                    reasons.push(`More reliable starter (${Math.round(inMins)} vs ${Math.round(outMins)} mins)`);
                }
            }
        }

        // Form-based reasons
        if (outForm < 3) {
            reasons.push(`${playerOut.name} poor form (${outForm.toFixed(1)})`);
        }

        if (inForm > 6) {
            reasons.push(`${playerIn.name} excellent form (${inForm.toFixed(1)})`);
        }

        // Injury/availability
        if (outChance < 75) {
            reasons.push('Injury/rotation risk');
        }

        // Performance metrics
        if (inPPG > outPPG + 1.5) {
            reasons.push(`Better PPG: ${inPPG.toFixed(1)} vs ${outPPG.toFixed(1)}`);
        }

        // Expected stats
        if (inXGI > outXGI * 1.3 && inXGI > 0.1) {
            reasons.push(`Higher xGI per 90: ${inXGI.toFixed(2)} vs ${outXGI.toFixed(2)}`);
        }

        // Bonus points potential
        const inBPSPerGame = inMinutes > 0 ? inBPS / (inMinutes / 90) : 0;
        const outBPSPerGame = outMinutes > 0 ? outBPS / (outMinutes / 90) : 0;
        if (inBPSPerGame > outBPSPerGame * 1.2 && inBPSPerGame > 20) {
            reasons.push('Better bonus potential');
        }

        // Minutes/rotation
        if (outMinutes < 500 && inMinutes > 1000) {
            reasons.push('More nailed-on starter');
        }

        // Differential
        if (inSelectedBy < 10 && inForm > 5) {
            reasons.push(`Differential pick (${inSelectedBy.toFixed(1)}% TSB)`);
        }

        // Value
        const inValue = inPPG / (parseFloat(playerIn.price) || 1);
        const outValue = outPPG / (parseFloat(playerOut.price) || 1);
        if (inValue > outValue * 1.2) {
            reasons.push('Better value');
        }

        return reasons.slice(0, 3).join('; ') || 'Statistical upgrade based on xG, xA, and BPS metrics';
    },

    // Calculate form trend (last 5 games performance)
    calculateFormTrend(player) {
        const form = parseFloat(player.form) || 0;
        const ppg = parseFloat(player.pointsPerGame) || 0;

        if (isNaN(form) || isNaN(ppg)) return 'Stable';

        if (form > ppg + 1) return 'Rising';
        if (form < ppg - 1) return 'Falling';
        return 'Stable';
    },

    // Get player value score (points per million)
    getValueScore(player) {
        const points = parseFloat(player.points) || 0;
        const price = parseFloat(player.price) || 1;

        if (price === 0 || isNaN(price)) return 0;

        const score = (points / price) * 10;
        const rounded = Math.round(score) / 10;
        return isNaN(rounded) ? 0 : rounded;
    },

    // Predict captain choice for next gameweek
    async suggestCaptain(team) {
        const predictions = await this.predictTeamPoints(team);

        // Sort by expected points
        predictions.sort((a, b) => b.expectedPoints - a.expectedPoints);

        return {
            captain: predictions[0],
            viceCaptain: predictions[1],
            alternatives: predictions.slice(2, 5)
        };
    }
};
