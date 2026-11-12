(function(){
  class S7DroneAI {
    update(enemies, player, dt, collide, scene, projectiles, sound, randomRange, obstacles = []) {
      const hasLineOfSight = (from, to) => {
        const dx = to.x - from.x, dz = to.z - from.z;
        for (const box of obstacles) {
          let tMin = 0, tMax = 1;
          for (const [origin, delta, min, max] of [
            [from.x, dx, box.x0, box.x1],
            [from.z, dz, box.z0, box.z1]
          ]) {
            if (Math.abs(delta) < 1e-8) {
              if (origin < min || origin > max) { tMin = 2; break; }
            } else {
              let t1 = (min - origin) / delta, t2 = (max - origin) / delta;
              if (t1 > t2) [t1, t2] = [t2, t1];
              tMin = Math.max(tMin, t1);
              tMax = Math.min(tMax, t2);
            }
          }
          if (tMin <= tMax && tMin > 0.04 && tMin < 0.96) return false;
        }
        return true;
      };
      for (const enemy of enemies) {
        const group = enemy.g;
        enemy.t += dt;
        enemy.hitStunRemaining = Math.max(0, (enemy.hitStunRemaining || 0) - dt);
        const hitStunned = enemy.hitStunRemaining > 0;
        // The Warden escalates once, at half health, rather than relying on raw stats alone.
        if (enemy.type === 'warden' && enemy.phase === 1
          && Number.isFinite(enemy.maxHp) && enemy.hp <= enemy.maxHp * 0.5) {
          enemy.phase = 2;
          enemy.moveSpeed *= 1.35;
          enemy.attackMin *= 0.78;
          enemy.attackMax *= 0.82;
          enemy.damage *= 1.15;
          enemy.projectileSpeed *= 1.12;
          enemy.spread *= 0.9;
          enemy.cd = Math.min(enemy.cd, 0.7);
          enemy.eyeColor = 0xff8de5;
          enemy.phaseTransitionRemaining = 1.8;
          sound(180, 0.3, 'sawtooth', 0.2);
        }
        const dx = player.pos.x - group.position.x;
        const dz = player.pos.z - group.position.z;
        const distance = Math.hypot(dx, dz) || 1;
        const preferredDistance = enemy.preferredDistance || 6;
        const visible = hasLineOfSight(group.position, player.pos);
        const strafeSign = enemy.strafeSign || 1;
        let moveX, moveZ;

        if (!visible) {
          // When cover blocks the shot, move toward a point offset around its edge.
          const flankOffset = enemy.flankOffset || 3.8;
          const flankX = player.pos.x - (dz / distance) * flankOffset * strafeSign;
          const flankZ = player.pos.z + (dx / distance) * flankOffset * strafeSign;
          const flankDx = flankX - group.position.x;
          const flankDz = flankZ - group.position.z;
          const flankDistance = Math.hypot(flankDx, flankDz) || 1;
          const speed = enemy.moveSpeed || 2.4;
          moveX = flankDx / flankDistance * speed;
          moveZ = flankDz / flankDistance * speed;
        } else {
          const strafing = distance < preferredDistance + 2 ? 1 : 0;
          const lateral = strafeSign * strafing * Math.sin(enemy.t * (enemy.strafeFrequency || 0.7)) * (enemy.strafeAmplitude || 2.2);
          const speed = enemy.moveSpeed || 2.4;
          let forward;
          if (enemy.type === 'sniper') {
            forward = distance > preferredDistance + 1 ? speed * 0.65 * (enemy.approachMultiplier || 1)
              : distance < preferredDistance - 2 ? -speed * 0.85 * (enemy.retreatMultiplier || 1) : 0;
          } else if (enemy.type === 'heavy') {
            forward = distance > preferredDistance ? speed * 0.75 * (enemy.approachMultiplier || 1) : -0.25;
          } else if (enemy.type === 'assault') {
            forward = distance > preferredDistance ? speed * 1.15 * (enemy.approachMultiplier || 1) : 0.15;
          } else {
            forward = distance > preferredDistance ? speed * (enemy.approachMultiplier || 1) : -0.6 * (enemy.retreatMultiplier || 1);
          }
          moveX = dx / distance * forward - (dz / distance) * lateral;
          moveZ = dz / distance * forward + (dx / distance) * lateral;
        }

        // Repel from nearby cover. If a drone is already inside an AABB,
        // choose its nearest face so it can recover instead of remaining stuck.
        for (const box of obstacles) {
          const inside = group.position.x >= box.x0 && group.position.x <= box.x1
            && group.position.z >= box.z0 && group.position.z <= box.z1;
          let awayX = group.position.x - Math.max(box.x0, Math.min(box.x1, group.position.x));
          let awayZ = group.position.z - Math.max(box.z0, Math.min(box.z1, group.position.z));
          let awayDistance = Math.hypot(awayX, awayZ);
          if (inside) {
            const faces = [
              { distance: group.position.x - box.x0, x: -1, z: 0 },
              { distance: box.x1 - group.position.x, x: 1, z: 0 },
              { distance: group.position.z - box.z0, x: 0, z: -1 },
              { distance: box.z1 - group.position.z, x: 0, z: 1 }
            ].sort((a, b) => a.distance - b.distance);
            awayX = faces[0].x;
            awayZ = faces[0].z;
            awayDistance = 0;
          }
          if ((inside || awayDistance < 1.35) && (awayDistance > 0.001 || inside)) {
            const strength = inside ? 5 : (1.35 - awayDistance) * 3.2;
            const normalizer = inside ? 1 : awayDistance;
            moveX += awayX / normalizer * strength;
            moveZ += awayZ / normalizer * strength;
          }
        }

        const reactionScale = hitStunned ? 0.18 : 1;
        group.position.x += moveX * dt * reactionScale;
        group.position.z += moveZ * dt * reactionScale;
        // A surviving unit tries to break the player's firing lane after impact.
        enemy.evasionRemaining = Math.max(0, (enemy.evasionRemaining || 0) - dt);
        if (!hitStunned && enemy.evasionRemaining > 0) {
          const evasion = enemy.evasionVelocity || { x: 0, z: 0 };
          const fade = Math.min(1, enemy.evasionRemaining / 0.18);
          group.position.x += evasion.x * fade * dt;
          group.position.z += evasion.z * fade * dt;
        }
        const hitVelocity = enemy.hitReactionVelocity;
        if (hitVelocity && Number.isFinite(hitVelocity.x) && Number.isFinite(hitVelocity.z)) {
          group.position.x += hitVelocity.x * dt;
          group.position.z += hitVelocity.z * dt;
          const damping = Math.exp(-8 * dt);
          hitVelocity.x *= damping;
          hitVelocity.z *= damping;
          if (Math.hypot(hitVelocity.x, hitVelocity.z) < 0.08) {
            hitVelocity.x = 0;
            hitVelocity.z = 0;
          }
        }
        group.position.y = 1.3 + Math.sin(enemy.t * (enemy.type === 'heavy' ? 1.25 : 2.2)) * (enemy.type === 'heavy' ? 0.045 : 0.12);
        collide(group.position, 0.5);
        group.lookAt(player.pos.x, group.position.y, player.pos.z);

        // Readable silhouette animation: light units bank sharply, heavy units
        // rock with inertia, and the Warden's frame becomes more aggressive in phase two.
        const windup = Math.max(0, enemy.attackWindupRemaining || 0);
        if (group.rotation) {
          const bank = Math.sin(enemy.t * (enemy.type === 'scout' ? 3.8 : 1.7)) * (enemy.type === 'scout' ? 0.16 : enemy.type === 'heavy' ? 0.035 : 0.075);
          const evadeTilt = !hitStunned && enemy.evasionRemaining > 0
            ? (enemy.evasionVelocity?.x || 0) * 0.035 : 0;
          group.rotation.z = bank + evadeTilt + (windup > 0 ? (enemy.type === 'heavy' ? -0.13 : 0.09) : 0);
          group.rotation.x = enemy.type === 'warden' && enemy.phase === 2
            ? Math.sin(enemy.t * 4.5) * 0.055 : 0;
        }
        if (enemy.visual) {
          const visual = enemy.visual;
          if (visual.ring) {
            visual.ring.rotation.z += dt * (enemy.type === 'sniper' ? 2.8 : enemy.type === 'warden' ? 2.2 : enemy.type === 'heavy' ? 0.42 : 1.15);
            const pulse = 1 + Math.sin(enemy.t * (enemy.type === 'scout' ? 5 : 2.1)) * (enemy.type === 'scout' ? 0.07 : 0.025);
            const chargeScale = windup > 0 ? 1 + Math.sin((1 - windup / ({ scout: 0.08, assault: 0.16, heavy: 0.72, sniper: 1.05, warden: enemy.phase === 2 ? 0.42 : 0.68 }[enemy.type] || 0.2)) * Math.PI) * 0.22 : 1;
            visual.ring.scale.setScalar(pulse * chargeScale);
          }
          if (visual.sensor && visual.sensor.scale) {
            const sensorPulse = 1 + Math.sin(enemy.t * (windup > 0 ? 22 : 3.2)) * (windup > 0 ? 0.28 : 0.06);
            visual.sensor.scale.setScalar(sensorPulse);
          }
          if (visual.head && visual.head.rotation) visual.head.rotation.y = Math.sin(enemy.t * 1.4) * (enemy.type === 'sniper' ? 0.12 : 0.035);
          if (visual.core) {
            visual.core.rotation.y += dt * (windup > 0 ? 8 : enemy.phase === 2 ? 5 : 1.2);
            const corePulse = windup > 0 ? 1 + Math.sin(enemy.t * 20) * 0.18 : 1 + Math.sin(enemy.t * 2.5) * 0.06;
            visual.core.scale.setScalar(corePulse);
          }
          if (enemy.type === 'warden' && enemy.phase === 2) {
            enemy.phaseTransitionRemaining = Math.max(0, (enemy.phaseTransitionRemaining || 0) - dt);
            const transitionProgress = 1 - enemy.phaseTransitionRemaining / 1.8;
            const transitionPulse = enemy.phaseTransitionRemaining > 0
              ? 1 + Math.sin(transitionProgress * Math.PI * 5) * 0.3 : 1;
            if (visual.ring.material?.color) visual.ring.material.color.setHex(0xff58d4);
            visual.ring.scale.setScalar(transitionPulse);
            visual.ring.rotation.z += dt * (enemy.phaseTransitionRemaining > 0 ? 5.5 : 0);
            if (visual.core) {
              if (visual.core.material?.color) visual.core.material.color.setHex(0xff58d4);
              visual.core.scale.setScalar(transitionPulse * (1 + Math.sin(enemy.t * 7) * 0.12));
            }
            if (visual.phaseHalo) {
              const halo = visual.phaseHalo;
              const active = enemy.phaseTransitionRemaining > 0;
              halo.visible = active;
              if (active) {
                const wave = Math.max(0, Math.sin(transitionProgress * Math.PI));
                halo.scale.setScalar(0.35 + transitionProgress * 2.15);
                if (halo.material) halo.material.opacity = wave * 0.9;
                halo.rotation.z += dt * 2.4;
              } else if (halo.material) {
                halo.material.opacity = 0;
              }
            }
          }
          if (enemy.type === 'warden' && visual.attackMarker) {
            const marker = visual.attackMarker;
            const telegraphActive = windup > 0;
            marker.visible = telegraphActive;
            if (telegraphActive) {
              const totalWindup = enemy.phase === 2 ? 0.42 : 0.68;
              const charge = Math.max(0, Math.min(1, 1 - windup / totalWindup));
              marker.position.set(0, -1.22, -distance);
              marker.scale.setScalar(0.72 + charge * 0.42);
              marker.rotation.z += dt * (enemy.phase === 2 ? 3.8 : 2.4);
              if (marker.material) {
                marker.material.opacity = 0.28 + charge * 0.58;
                if (marker.material.color) marker.material.color.setHex(enemy.phase === 2 ? 0xff58d4 : 0x55dfff);
              }
            } else if (marker.material) {
              marker.material.opacity = 0;
            }
          }
        }

        if (enemy.visual?.hitFlash) {
          const flash = enemy.visual.hitFlash;
          enemy.hitFlashRemaining = Math.max(0, (enemy.hitFlashRemaining || 0) - dt);
          const progress = enemy.hitFlashRemaining / 0.24;
          flash.visible = enemy.hitFlashRemaining > 0;
          if (flash.visible) {
            flash.scale.setScalar(0.3 + (1 - progress) * 0.85);
            if (flash.material) flash.material.opacity = Math.min(1, progress * 1.35);
          } else if (flash.material) {
            flash.material.opacity = 0;
          }
        }

        if (enemy.flash > 0) {
          enemy.flash -= dt;
          if (enemy.flash <= 0) enemy.m.emissive.setRGB(0, 0, 0);
        }

        enemy.cd -= dt;
        const eyeColor = enemy.eyeColor || 0xff3928;
        const windupBefore = Math.max(0, enemy.attackWindupRemaining || 0);
        const eyePulse = windupBefore > 0
          ? 1.2 + Math.abs(Math.sin(enemy.t * (enemy.type === 'sniper' ? 18 : 11))) * (enemy.type === 'sniper' ? 3.2 : 1.8)
          : enemy.cd < 0.4 ? 1.8 : 1;
        enemy.eye.color.setRGB(
          ((eyeColor >> 16) & 255) / 255 * eyePulse,
          ((eyeColor >> 8) & 255) / 255 * eyePulse,
          (eyeColor & 255) / 255 * eyePulse
        );

        const canAttack = !hitStunned && distance < 20 && hasLineOfSight(group.position, player.pos);
        if (canAttack && enemy.cd <= 0 && !(enemy.attackWindupRemaining > 0)) {
          const windups = { scout: 0.08, assault: 0.16, heavy: 0.72, sniper: 1.05, warden: enemy.phase === 2 ? 0.42 : 0.68 };
          enemy.attackWindupRemaining = windups[enemy.type] ?? 0.2;
          if (enemy.type === 'warden' && enemy.visual?.attackMarker) {
            const marker = enemy.visual.attackMarker;
            marker.visible = true;
            marker.position.set(0, -1.22, -distance);
            marker.scale.setScalar(0.72);
            if (marker.material) {
              marker.material.opacity = 0.28;
              if (marker.material.color) marker.material.color.setHex(enemy.phase === 2 ? 0xff58d4 : 0x55dfff);
            }
          }
        }
        if (enemy.attackWindupRemaining > 0) {
          enemy.attackWindupRemaining = Math.max(0, enemy.attackWindupRemaining - dt);
          if (enemy.attackWindupRemaining === 0 && canAttack) {
            if (enemy.visual?.attackMarker) {
              enemy.visual.attackMarker.visible = false;
              if (enemy.visual.attackMarker.material) enemy.visual.attackMarker.material.opacity = 0;
            }
            const speed = enemy.projectileSpeed || 13;
            const damage = enemy.damage || 8;
            const shot = (offsetX = 0, offsetY = 0, shotSpeed = speed, shotDamage = damage, spreadZ = 0) => {
              const projectileStyle = {
                scout: { color: 0x65e8ff, radius: 0.085, stretch: 1.35 },
                assault: { color: 0xff6338, radius: 0.105, stretch: 1.5 },
                heavy: { color: 0xffb04a, radius: 0.17, stretch: 1.8 },
                sniper: { color: 0xa58aff, radius: 0.075, stretch: 2.8 },
                warden: { color: enemy.phase === 2 ? 0xff58d4 : 0x55dfff, radius: 0.145, stretch: 1.9 }
              }[enemy.type] || { color: 0xff3928, radius: 0.1, stretch: 1.4 };
              const projectile = new THREE.Mesh(
                new THREE.SphereGeometry(projectileStyle.radius, 12, 10),
                new THREE.MeshBasicMaterial({ color: projectileStyle.color })
              );
              projectile.scale.set(1, 1, projectileStyle.stretch);
              projectile.position.copy(group.position);
              const velocity = new THREE.Vector3(
                player.pos.x + offsetX,
                1.2 + offsetY,
                player.pos.z + spreadZ
              ).sub(group.position).normalize().multiplyScalar(shotSpeed);
              if (typeof projectile.lookAt === 'function') {
                projectile.lookAt(projectile.position.clone().add(velocity));
              }
              scene.add(projectile);
              projectiles.push({ m: projectile, v: velocity, l: 3.2, damage: shotDamage });
            };

            if (enemy.type === 'assault') {
              // Three-round fan: aggressive pressure, but the spread gives the player a lane to dodge.
              shot(-0.42, 0, speed * 0.96, damage * 0.62, -0.12);
              shot(0, 0, speed, damage * 0.62, 0);
              shot(0.42, 0, speed * 0.96, damage * 0.62, 0.12);
              sound(420, 0.2, 'sawtooth', 0.12);
            } else if (enemy.type === 'heavy') {
              // Slow, broad shock volley, clearly telegraphed by its long charge.
              shot(-1.05, 0, speed * 0.78, damage * 0.48, -0.32);
              shot(0, 0, speed * 0.88, damage * 0.58, 0);
              shot(1.05, 0, speed * 0.78, damage * 0.48, 0.32);
              sound(105, 0.34, 'sawtooth', 0.18);
            } else if (enemy.type === 'sniper') {
              // Long lock-on, then a fast, narrow precision bolt.
              shot(randomRange(-0.035, 0.035), randomRange(-0.025, 0.025), speed * 1.28, damage * 1.15);
              sound(980, 0.16, 'triangle', 0.12);
            } else if (enemy.type === 'warden') {
              const phaseTwo = enemy.phase === 2;
              if (phaseTwo) {
                for (let i = -2; i <= 2; i++) shot(i * 0.48, 0, speed * 0.94, damage * 0.48, i * 0.2);
              } else {
                shot(-0.24, 0, speed, damage * 0.72, -0.08);
                shot(0.24, 0, speed, damage * 0.72, 0.08);
              }
              sound(phaseTwo ? 150 : 115, 0.28, 'sawtooth', 0.2);
            } else {
              shot(randomRange(-0.24, 0.24), randomRange(-0.12, 0.12), speed, damage * 0.82);
              sound(620, 0.1, 'square', 0.08);
            }
            enemy.cd = randomRange(enemy.attackMin || 1.4, enemy.attackMax || 2.4);
            enemy.strafeSign = -(enemy.strafeSign || 1);
          }
        }
      }
    }
  }


  S7DroneAI.PROFILES = Object.freeze({
    scout: Object.freeze({
      hp: 60, moveSpeed: 2.65, preferredDistance: 5.5,
      strafeAmplitude: 3.5, strafeFrequency: 2.1, approachMultiplier: 0.95, retreatMultiplier: 1.15,
      projectileSpeed: 14, damage: 6, spread: 0.42,
      attackMin: 1.2, attackMax: 1.9,
      bodyColor: 0x2b3037, eyeColor: 0xff3928, ringColor: 0x35bfff, hitStunDuration: 0.22, hitImpulse: 3.8
    }),
    assault: Object.freeze({
      hp: 72, moveSpeed: 3.35, preferredDistance: 3.8,
      strafeAmplitude: 1.1, strafeFrequency: 0.45, approachMultiplier: 1.35, retreatMultiplier: 0.55,
      projectileSpeed: 13, damage: 8, spread: 0.34,
      attackMin: 0.95, attackMax: 1.45,
      bodyColor: 0x49332d, eyeColor: 0xff5a18, ringColor: 0xff6a28, hitStunDuration: 0.17, hitImpulse: 2.8
    }),
    heavy: Object.freeze({
      hp: 120, moveSpeed: 1.5, preferredDistance: 6.8,
      strafeAmplitude: 0.55, strafeFrequency: 0.35, approachMultiplier: 0.8, retreatMultiplier: 0.35,
      projectileSpeed: 10, damage: 14, spread: 0.2,
      attackMin: 1.9, attackMax: 2.7,
      bodyColor: 0x3b424b, eyeColor: 0xff3322, ringColor: 0xffa23a, hitStunDuration: 0.10, hitImpulse: 0.85
    }),
    sniper: Object.freeze({
      hp: 75, moveSpeed: 1.25, preferredDistance: 10,
      strafeAmplitude: 2.8, strafeFrequency: 0.55, approachMultiplier: 0.75, retreatMultiplier: 1.45,
      projectileSpeed: 19, damage: 16, spread: 0.07,
      attackMin: 2.2, attackMax: 3.1,
      bodyColor: 0x292c48, eyeColor: 0x9a6bff, ringColor: 0x9675ff, hitStunDuration: 0.24, hitImpulse: 2.4
    }),
    warden: Object.freeze({
      hp: 280, moveSpeed: 1.65, preferredDistance: 7.2,
      strafeAmplitude: 1.8, strafeFrequency: 0.9, approachMultiplier: 1.05, retreatMultiplier: 0.7,
      projectileSpeed: 15, damage: 18, spread: 0.14,
      attackMin: 1.25, attackMax: 1.8,
      bodyColor: 0x282d3d, eyeColor: 0xff4fcb, ringColor: 0x46dfff, hitStunDuration: 0.08, hitImpulse: 0.45
    })
  });

  window.S7DroneAI = S7DroneAI;
})();
