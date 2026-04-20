"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const BASE = "/painel/comercial";

// ===== LEADS =====

export async function createLead(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;
  const source = (formData.get("source") as string) || "DIRETO";
  const sourceDetail = (formData.get("sourceDetail") as string) || null;
  const potentialValue = formData.get("potentialValue")
    ? parseFloat(formData.get("potentialValue") as string)
    : null;
  const nextStep = (formData.get("nextStep") as string) || null;
  const priority = (formData.get("priority") as string) || "MEDIUM";

  await db.bizLead.create({
    data: {
      name,
      phone,
      email,
      source,
      sourceDetail,
      potentialValue,
      nextStep,
      priority,
    },
  });

  revalidatePath(`${BASE}/leads`);
  redirect(`${BASE}/leads`);
}

export async function updateLeadStage(id: string, stage: string) {
  const data: Record<string, unknown> = { stage };
  if (stage === "CONTACT" || stage === "NEGOTIATION") {
    data.lastContactAt = new Date();
  }
  await db.bizLead.update({ where: { id }, data });
  revalidatePath(`${BASE}/leads`);
}

export async function updateLead(id: string, formData: FormData) {
  const nextStep = (formData.get("nextStep") as string) || null;
  const objections = (formData.get("objections") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const lostReason = (formData.get("lostReason") as string) || null;

  await db.bizLead.update({
    where: { id },
    data: { nextStep, objections, notes, lostReason },
  });
  revalidatePath(`${BASE}/leads/${id}`);
}

export async function addActivity(formData: FormData) {
  const leadId = (formData.get("leadId") as string) || null;
  const type = formData.get("type") as string;
  const channel = (formData.get("channel") as string) || null;
  const summary = formData.get("summary") as string;
  const result = (formData.get("result") as string) || null;

  await db.bizActivity.create({
    data: { leadId, type, channel, summary, result },
  });

  if (leadId) {
    await db.bizLead.update({
      where: { id: leadId },
      data: { lastContactAt: new Date() },
    });
    revalidatePath(`${BASE}/leads/${leadId}`);
  }
  revalidatePath(`${BASE}/leads`);
}

// ===== TASKS =====

export async function createTask(formData: FormData) {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const priority = (formData.get("priority") as string) || "MEDIUM";
  const deadline = formData.get("deadline")
    ? new Date(formData.get("deadline") as string)
    : null;
  const leadId = (formData.get("leadId") as string) || null;
  const initiativeId = (formData.get("initiativeId") as string) || null;
  const experimentId = (formData.get("experimentId") as string) || null;

  await db.bizTask.create({
    data: {
      title,
      description,
      priority,
      deadline,
      leadId,
      initiativeId,
      experimentId,
    },
  });

  revalidatePath(`${BASE}/tarefas`);
  redirect(`${BASE}/tarefas`);
}

export async function toggleTask(id: string) {
  const task = await db.bizTask.findUnique({ where: { id } });
  if (!task) return;

  const isDone = task.status === "DONE";
  await db.bizTask.update({
    where: { id },
    data: {
      status: isDone ? "TODO" : "DONE",
      completedAt: isDone ? null : new Date(),
    },
  });
  revalidatePath(`${BASE}/tarefas`);
}

export async function updateTaskStatus(id: string, status: string) {
  await db.bizTask.update({
    where: { id },
    data: {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });
  revalidatePath(`${BASE}/tarefas`);
}

// ===== OFFERS =====

export async function createOffer(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const price = parseFloat(formData.get("price") as string);
  const priceType = (formData.get("priceType") as string) || "ONE_TIME";
  const includes = (formData.get("includes") as string) || null;
  const validUntil = formData.get("validUntil")
    ? new Date(formData.get("validUntil") as string)
    : null;

  await db.bizOffer.create({
    data: { name, description, price, priceType, includes, validUntil },
  });

  revalidatePath(`${BASE}/ofertas`);
  redirect(`${BASE}/ofertas`);
}

export async function toggleOfferStatus(id: string) {
  const offer = await db.bizOffer.findUnique({ where: { id } });
  if (!offer) return;

  await db.bizOffer.update({
    where: { id },
    data: { status: offer.status === "ACTIVE" ? "PAUSED" : "ACTIVE" },
  });
  revalidatePath(`${BASE}/ofertas`);
}

// ===== EXPERIMENTS =====

export async function createExperiment(formData: FormData) {
  const hypothesis = formData.get("hypothesis") as string;
  const channel = (formData.get("channel") as string) || null;
  const priority = (formData.get("priority") as string) || "MEDIUM";
  const effort = (formData.get("effort") as string) || null;
  const cost = formData.get("cost")
    ? parseFloat(formData.get("cost") as string)
    : null;
  const expectedResult = (formData.get("expectedResult") as string) || null;

  await db.bizExperiment.create({
    data: { hypothesis, channel, priority, effort, cost, expectedResult },
  });

  revalidatePath(`${BASE}/experimentos`);
  redirect(`${BASE}/experimentos`);
}

export async function updateExperimentStatus(id: string, status: string) {
  const data: Record<string, unknown> = { status };
  if (status === "RUNNING") data.startedAt = new Date();
  if (status === "COMPLETED" || status === "KILLED")
    data.completedAt = new Date();

  await db.bizExperiment.update({ where: { id }, data });
  revalidatePath(`${BASE}/experimentos`);
}

export async function saveExperimentResult(id: string, formData: FormData) {
  const actualResult = (formData.get("actualResult") as string) || null;
  const learning = (formData.get("learning") as string) || null;
  const decision = (formData.get("decision") as string) || null;

  await db.bizExperiment.update({
    where: { id },
    data: { actualResult, learning, decision },
  });
  revalidatePath(`${BASE}/experimentos`);
}

// ===== INITIATIVES =====

export async function createInitiative(formData: FormData) {
  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const impact = (formData.get("impact") as string) || null;
  const effort = (formData.get("effort") as string) || null;
  const owner = (formData.get("owner") as string) || null;
  const nextStep = (formData.get("nextStep") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  await db.bizInitiative.create({
    data: { title, category, impact, effort, owner, nextStep, notes },
  });

  revalidatePath(`${BASE}/iniciativas`);
  redirect(`${BASE}/iniciativas`);
}

export async function updateInitiativePhase(id: string, phase: string) {
  await db.bizInitiative.update({ where: { id }, data: { phase } });
  revalidatePath(`${BASE}/iniciativas`);
}

// ===== KPIs =====

export async function addKpiSnapshot(formData: FormData) {
  const kpiId = formData.get("kpiId") as string;
  const value = parseFloat(formData.get("value") as string);
  const note = (formData.get("note") as string) || null;

  await db.bizKpiSnapshot.create({
    data: { kpiId, value, note },
  });
  revalidatePath(`${BASE}/kpis`);
}
