import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FinancialInfoFormProps {
  onSubmit?: (data: {
    purpose: string;
    salary: string;
    cash: string;
    workLocation: string;
  }) => void;
}

export default function FinancialInfoForm({ onSubmit }: FinancialInfoFormProps) {
  const [purpose, setPurpose] = useState("");
  const [salary, setSalary] = useState("");
  const [cash, setCash] = useState("");
  const [workLocation, setWorkLocation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct message to send to chat
    const message = `매매 목적: ${purpose === 'residence' ? '실거주' : '갭투자'}
연봉: ${salary}만원
보유 현금: ${cash}억원
출퇴근 지역: ${workLocation}

이 조건으로 아파트를 추천해주세요!`;

    // Trigger parent's message sending function
    if (onSubmit) {
      onSubmit({ purpose, salary, cash, workLocation });
    } else {
      // If no onSubmit provided, simulate clicking send button
      const chatInput = document.querySelector('input[placeholder*="집사 냥"]') as HTMLInputElement;
      const sendButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      
      if (chatInput && sendButton) {
        chatInput.value = message;
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        sendButton.click();
      }
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4 min-w-[280px]">
      <h3 className="font-semibold text-gray-800 text-center">💰 재정 정보 입력</h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
            매매 목적
          </Label>
          <Select value={purpose} onValueChange={setPurpose} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="목적을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residence">실거주</SelectItem>
              <SelectItem value="gap_investment">갭투자</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
            연봉 (세전)
          </Label>
          <Input
            id="salary"
            type="text"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="예: 8000만원"
            required
            className="focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        <div>
          <Label htmlFor="cash" className="block text-sm font-medium text-gray-700 mb-1">
            보유 현금
          </Label>
          <Input
            id="cash"
            type="text"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
            placeholder="예: 2억원"
            required
            className="focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        <div>
          <Label htmlFor="workLocation" className="block text-sm font-medium text-gray-700 mb-1">
            출퇴근 지역
          </Label>
          <Input
            id="workLocation"
            type="text"
            value={workLocation}
            onChange={(e) => setWorkLocation(e.target.value)}
            placeholder="예: 강남구, 여의도"
            required
            className="focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-accent hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors"
        >
          분석 시작하기
        </Button>
      </form>
    </div>
  );
}
