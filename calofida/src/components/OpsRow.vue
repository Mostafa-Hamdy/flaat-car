<script setup>
import { reactive, computed, watch } from 'vue'
import { useOpsStore } from '../stores/ops.js'
import { fmtMoney } from '../utils/helpers.js'
import { computeRow, isBlankRow, draftFrom, recordFields } from '../utils/ops.js'

const props = defineProps({
  car: Object,
  date: String,
  record: Object, // stored record for this car+date, if any
  info: Object, // dateInfo(date)
  isFirst: Boolean, // first row of the day -> renders the merged date cell
  groupSize: Number,
  driverNames: Array, // active drivers only
  editable: Boolean,
})

const ops = useOpsStore()
const draft = reactive(draftFrom(props.record))
const calc = computed(() => computeRow(draft))
const driverOptions = computed(() =>
  draft.driver && !props.driverNames.includes(draft.driver) ? [...props.driverNames, draft.driver] : props.driverNames)

// Reset the inputs only when the stored record disappears (cleared), never on our own saves.
watch(() => !!props.record, (has) => { if (!has) Object.assign(draft, draftFrom()) })

async function save() {
  if (isBlankRow(draft)) return ops.removeRow(props.car.plate, props.date)
  await ops.saveRow(props.car.plate, props.date, recordFields(draft))
}

async function clearRow() {
  if (!confirm('هل تريد مسح بيانات هذا اليوم لهذه السيارة؟')) return
  await ops.removeRow(props.car.plate, props.date)
}
</script>

<template>
  <tr class="ops-row" :class="{ 'ops-row-filled': !!record, 'ops-day-start': isFirst }">
    <td v-if="isFirst" class="ops-date-cell" :rowspan="groupSize">
      <div class="ops-date-day">{{ info.day }}</div>
      <div class="num">{{ date }}</div>
      <div class="ops-date-half">{{ info.half }}</div>
    </td>
    <td class="ops-car-cell">
      <div class="ops-car-plate">{{ car.plate }}</div>
      <div class="ops-car-sub">{{ car.brand }} {{ car.model }}</div>
    </td>
    <td>
      <select v-model="draft.driver" class="ops-cell" :disabled="!editable" @change="save">
        <option value=""></option>
        <option v-for="n in driverOptions" :key="n" :value="n">{{ n }}</option>
      </select>
    </td>
    <td>
      <select v-model="draft.kind" class="ops-cell" :disabled="!editable" @change="save">
        <option value="تشغيلة">تشغيلة</option>
        <option value="إيجار">إيجار</option>
      </select>
    </td>
    <td><input v-model="draft.contract" class="ops-cell" :disabled="!editable" @change="save"></td>
    <td><input v-model="draft.km1" class="ops-cell num" type="number" step="1" :disabled="!editable" @change="save"></td>
    <td><input v-model="draft.km2" class="ops-cell num" type="number" step="1" :disabled="!editable" @change="save"></td>
    <td class="num ops-computed">{{ fmtMoney(calc.kmnet) }}</td>
    <td><input v-model="draft.from" class="ops-cell" :disabled="!editable" @change="save"></td>
    <td><input v-model="draft.to" class="ops-cell" :disabled="!editable" @change="save"></td>
    <td><input v-model="draft.revlimo" class="ops-cell num" type="number" step="0.01" :disabled="!editable" @change="save"></td>
    <td><input v-model="draft.revtrip" class="ops-cell num" type="number" step="0.01" :disabled="!editable" @change="save"></td>
    <td><input v-model="draft.exp" class="ops-cell num" type="number" step="0.01" :disabled="!editable" @change="save"></td>
    <td class="num ops-computed" :class="calc.profit >= 0 ? 'pos' : 'neg'">{{ fmtMoney(calc.profit) }}</td>
    <td><input v-model="draft.bank" class="ops-cell" :disabled="!editable" @change="save"></td>
    <td><input v-model="draft.depno" class="ops-cell" :disabled="!editable" @change="save"></td>
    <td><input v-model="draft.tax" class="ops-cell num" type="number" step="0.01" :disabled="!editable" @change="save"></td>
    <td class="num ops-computed">{{ fmtMoney(calc.afterTax) }}</td>
    <td><input v-model="draft.invoice" class="ops-cell" :disabled="!editable" @change="save"></td>
    <td><input v-model="draft.notes" class="ops-cell" :disabled="!editable" @change="save"></td>
    <td class="ops-clear-cell"><button v-if="record && editable" class="btn danger small" @click="clearRow">مسح</button></td>
  </tr>
</template>
